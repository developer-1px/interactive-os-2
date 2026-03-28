import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import type { Plugin } from 'vite'
import type { SDKSession, SDKMessage } from '@anthropic-ai/claude-agent-sdk'
import type { ChatWsClientMessage, ChatWsServerMessage } from './src/pages/chat/chatWsProtocol'

// --- Chat mode: SDK message handler ---

function handleSdkMessage(
  sessionId: string,
  sdkMsg: SDKMessage,
  wsSend: (event: string, data: unknown) => void,
  getText: () => string,
  setText: (t: string) => void,
) {
  // Streaming token
  if (sdkMsg.type === 'stream_event') {
    const evt = sdkMsg.event
    if (evt.type === 'content_block_delta' && 'delta' in evt) {
      const delta = evt.delta as { type: string; text?: string }
      if (delta.type === 'text_delta' && delta.text) {
        setText(getText() + delta.text)
        const reply: ChatWsServerMessage = { type: 'assistant-text', sessionId, text: delta.text }
        wsSend('chat:server', reply)
      }
    }
    return
  }

  // Complete assistant message — extract text if not already streamed via stream_event
  if (sdkMsg.type === 'assistant') {
    if (!getText()) {
      // Non-streaming mode: text arrives in the assistant message itself
      const msg = (sdkMsg as { message?: { content?: unknown[] } }).message
      if (msg?.content) {
        for (const block of msg.content) {
          if (typeof block === 'object' && block !== null) {
            const b = block as { type?: string; text?: string }
            if (b.type === 'text' && b.text) {
              wsSend('chat:server', { type: 'assistant-text', sessionId, text: b.text } satisfies ChatWsServerMessage)
            }
          }
        }
      }
    }
    setText('')
    wsSend('chat:server', { type: 'assistant-done', sessionId } satisfies ChatWsServerMessage)
    return
  }

  // Init — log skills to diagnose local skill loading
  if (sdkMsg.type === 'system' && (sdkMsg as Record<string, unknown>).subtype === 'init') {
    console.log('[SDK init] skills:', (sdkMsg as Record<string, unknown>).skills)
    console.log('[SDK init] slash_commands:', (sdkMsg as Record<string, unknown>).slash_commands)
  }

  // Session state change
  if (sdkMsg.type === 'system' && 'subtype' in sdkMsg && (sdkMsg as Record<string, unknown>).subtype === 'session_state_changed') {
    const state = (sdkMsg as { state: 'idle' | 'running' | 'requires_action' }).state
    const reply: ChatWsServerMessage = { type: 'state-changed', sessionId, state }
    wsSend('chat:server', reply)
  }
}

// --- Types for parsed transcript events ---

interface TimelineEvent {
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result'
  ts: string
  tool?: string
  filePath?: string
  text?: string
  editOld?: string
  editNew?: string
}

// --- Parse a single JSONL line into timeline events ---

function parseTranscriptLine(raw: string): TimelineEvent[] {
  let obj: Record<string, unknown>
  try { obj = JSON.parse(raw) } catch { return [] }

  const type = obj.type as string
  const events: TimelineEvent[] = []
  const ts = (obj.timestamp as string) ?? new Date().toISOString()

  if (type === 'user') {
    const msg = obj.message as Record<string, unknown> | undefined
    if (!msg) return []
    const content = msg.content
    let text = ''
    if (typeof content === 'string') {
      text = content
    } else if (Array.isArray(content)) {
      for (const b of content) {
        if (typeof b === 'object' && b !== null && (b as Record<string, unknown>).type === 'text') {
          text += (b as Record<string, unknown>).text as string
        }
      }
    }
    // Strip XML tags for cleaner display
    text = text.replace(/<[^>]+>/g, '').trim()
    if (!text) return []

    // Drop pure noise — no value even as "..."
    const dropPatterns = [
      /^Caveat:/,
      /^\/clear$/,
      /^clear$/,
      /^Read the output file to retrieve/,
      /toolu_/,
      /failed with exit code/,
      /^Background command/,
      /^Hook \w+ success/,
      /^OK$/,
      /^UserPromptSubmit hook/,
      /^SessionStart/,
    ]
    if (dropPatterns.some(p => p.test(text))) return []

    // Detect system-injected content → drop entirely (shown as tool_use instead)
    const isInjected =
      // Skill bodies / system prompts
      text.startsWith('Base directory for this skill:') ||
      text.startsWith('Launching skill:') ||
      text.startsWith('ARGUMENTS:') ||
      text.startsWith('This skill') ||
      // Long structured content (skills, agent results, hook output)
      (text.length > 300 && /^#{1,4} /m.test(text)) ||
      // Agent subagent results
      (text.length > 500)

    if (isInjected) return []

    events.push({ type: 'user', ts, text })
  }

  if (type === 'assistant') {
    const msg = obj.message as Record<string, unknown> | undefined
    if (!msg) return []
    const content = msg.content as unknown[]
    if (!Array.isArray(content)) return []

    for (const block of content) {
      if (typeof block !== 'object' || block === null) continue
      const b = block as Record<string, unknown>

      if (b.type === 'text') {
        const text = (b.text as string).replace(/<[^>]+>/g, '').trim()
        if (text) {
          events.push({ type: 'assistant', ts, text })
        }
      }

      if (b.type === 'tool_use') {
        const name = b.name as string
        const input = (b.input ?? {}) as Record<string, unknown>
        const evt: TimelineEvent = { type: 'tool_use', ts, tool: name }

        if (name === 'Read' || name === 'Edit' || name === 'Write') {
          evt.filePath = input.file_path as string
        }
        if (name === 'Edit') {
          evt.editOld = input.old_string as string
          evt.editNew = input.new_string as string
        }
        if (name === 'Bash') {
          evt.text = input.command as string
        }
        if (name === 'Glob' || name === 'Grep') {
          evt.text = input.pattern as string
        }
        if (name === 'Skill') {
          evt.text = input.skill as string
        }

        events.push(evt)
      }
    }
  }

  return events
}

// --- Find the most recent transcript JSONL ---

function getTranscriptDir(projectRoot: string): string | null {
  const encoded = projectRoot.replace(/\//g, '-')
  const dir = path.join(os.homedir(), '.claude', 'projects', encoded)
  return fs.existsSync(dir) ? dir : null
}

interface SessionInfo {
  id: string
  filePath: string
  mtime: number
  label: string // first user message or timestamp
  active: boolean
}

const ACTIVE_THRESHOLD_MS = 10 * 60 * 1000 // 10분 — 브라우저 연결 제한(6) 때문에 active를 좁게

function listSessions(projectRoot: string, limit = 20): SessionInfo[] {
  const dir = getTranscriptDir(projectRoot)
  if (!dir) return []

  const files = fs.readdirSync(dir)
    .filter(f => f.endsWith('.jsonl'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(dir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
    .slice(0, limit)

  return files.map(f => {
    const id = f.name.replace('.jsonl', '')
    const filePath = path.join(dir, f.name)
    // Extract first user message as label
    let label = new Date(f.mtime).toLocaleString('ko-KR', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    })
    try {
      const content = fs.readFileSync(filePath, 'utf-8')
      for (const line of content.split('\n').slice(0, 80)) {
        if (!line.trim()) continue
        const obj = JSON.parse(line)
        if (obj.type === 'user') {
          const msg = obj.message
          let text = ''
          if (typeof msg?.content === 'string') text = msg.content
          else if (Array.isArray(msg?.content)) {
            for (const b of msg.content) {
              if (b?.type === 'text') text += b.text
            }
          }
          // Strip XML/HTML tags and system noise
          text = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
          // Skip system-generated and command messages
          if (text.startsWith('Caveat:') || text.startsWith('/clear') || text.startsWith('clear')
            || text.startsWith('Base directory') || text.startsWith('ARGUMENTS:')
            || text.length <= 5) continue
          label = text.slice(0, 60)
          break
        }
      }
    } catch { /* ignore */ }
    return { id, filePath, mtime: f.mtime, label, active: (Date.now() - f.mtime) < ACTIVE_THRESHOLD_MS }
  })
}

function findLatestTranscript(projectRoot: string): string | null {
  const sessions = listSessions(projectRoot, 1)
  return sessions.length > 0 ? sessions[0].filePath : null
}

function loadTranscriptEvents(filePath: string, limit = 2000): TimelineEvent[] {
  if (!fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.trim().split('\n').filter(Boolean)
  const allEvents: TimelineEvent[] = []
  for (const line of lines) {
    allEvents.push(...parseTranscriptLine(line))
  }
  return allEvents.length > limit ? allEvents.slice(-limit) : allEvents
}

// --- Also keep existing NDJSON ops support ---

function getLatestOps(opsDir: string): unknown[] {
  if (!fs.existsSync(opsDir)) return []
  const files = fs.readdirSync(opsDir)
    .filter(f => f.endsWith('.ndjson'))
    .map(f => ({ name: f, mtime: fs.statSync(path.join(opsDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime)
  if (files.length === 0) return []
  const content = fs.readFileSync(path.join(opsDir, files[0].name), 'utf-8')
  return content.trim().split('\n').filter(Boolean).map(l => JSON.parse(l))
}

export function agentOpsPlugin(): Plugin {
  return {
    name: 'vite-plugin-agent-ops',
    configureServer(server) {
      const projectRoot = path.resolve('.')
      const opsDir = path.resolve('.claude/agent-ops')
      fs.mkdirSync(opsDir, { recursive: true })

      // --- Multiplexed SSE: single connection serves all sessions ---
      // Key: filePath → tracked size for tailing
      const transcriptSizes = new Map<string, number>()
      // Key: filePath → set of session IDs (for reverse lookup)
      const watchedPaths = new Map<string, Set<string>>()
      // All connected mux clients
      const muxClients = new Set<import('node:http').ServerResponse>()
      // Key: sessionId → filePath
      const sessionPaths = new Map<string, string>()
      // Key: client → set of subscribed session IDs
      const clientSubscriptions = new Map<import('node:http').ServerResponse, Set<string>>()

      function resolveSessionPath(sessionId: string): string | null {
        const dir = getTranscriptDir(projectRoot)
        if (!dir) return null
        const candidate = path.join(dir, `${sessionId}.jsonl`)
        return fs.existsSync(candidate) ? candidate : null
      }

      function watchSession(sessionId: string) {
        if (sessionPaths.has(sessionId)) return
        const filePath = resolveSessionPath(sessionId)
        if (!filePath) return
        sessionPaths.set(sessionId, filePath)
        server.watcher.add(filePath)
        if (!transcriptSizes.has(filePath)) {
          transcriptSizes.set(filePath, fs.statSync(filePath).size)
        }
        if (!watchedPaths.has(filePath)) {
          watchedPaths.set(filePath, new Set())
        }
        watchedPaths.get(filePath)!.add(sessionId)
      }

      function unwatchSessionIfOrphaned(sessionId: string) {
        // Check if any client still subscribes to this session
        for (const subs of clientSubscriptions.values()) {
          if (subs.has(sessionId)) return
        }
        const filePath = sessionPaths.get(sessionId)
        if (!filePath) return
        sessionPaths.delete(sessionId)
        const pathSessions = watchedPaths.get(filePath)
        if (pathSessions) {
          pathSessions.delete(sessionId)
          if (pathSessions.size === 0) {
            watchedPaths.delete(filePath)
            transcriptSizes.delete(filePath)
            server.watcher.unwatch(filePath)
          }
        }
      }

      server.watcher.on('change', (changedPath) => {
        const sessions = watchedPaths.get(changedPath)
        if (!sessions || sessions.size === 0) return
        if (muxClients.size === 0) return

        const prevSize = transcriptSizes.get(changedPath) ?? 0
        const stat = fs.statSync(changedPath)
        if (stat.size <= prevSize) {
          transcriptSizes.set(changedPath, stat.size)
          return
        }

        const fd = fs.openSync(changedPath, 'r')
        const buf = Buffer.alloc(stat.size - prevSize)
        fs.readSync(fd, buf, 0, buf.length, prevSize)
        fs.closeSync(fd)
        transcriptSizes.set(changedPath, stat.size)

        const newLines = buf.toString('utf-8').trim().split('\n').filter(Boolean)
        // Find session ID for this path
        const sessionId = [...sessions][0] // one file = one session
        for (const line of newLines) {
          const events = parseTranscriptLine(line)
          for (const evt of events) {
            const payload = JSON.stringify({ session: sessionId, ...evt })
            for (const client of muxClients) {
              const subs = clientSubscriptions.get(client)
              if (subs && subs.has(sessionId)) {
                client.write(`data: ${payload}\n\n`)
              }
            }
          }
        }
      })

      server.middlewares.use((req, res, next) => {
        const url = new URL(req.url!, `http://${req.headers.host}`)

        // Existing: NDJSON ops
        if (url.pathname === '/api/agent-ops/latest') {
          const data = getLatestOps(opsDir)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(data))
          return
        }

        // Session list
        if (url.pathname === '/api/agent-ops/sessions') {
          const sessions = listSessions(projectRoot)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(sessions.map(s => ({ id: s.id, mtime: s.mtime, label: s.label, active: s.active }))))
          return
        }

        // Timeline for a specific session — supports tail pagination
        // ?session=X          → last 100 events + total count
        // ?session=X&tail=200 → last 200 events + total count
        // ?session=X&before=500 → 100 events before index 500 (for scroll-up loading)
        if (url.pathname === '/api/agent-ops/timeline') {
          const sessionId = url.searchParams.get('session')
          const tail = parseInt(url.searchParams.get('tail') ?? '100', 10)
          const before = url.searchParams.get('before')
          let filePath: string | null = null

          if (sessionId) {
            const dir = getTranscriptDir(projectRoot)
            if (dir) {
              const candidate = path.join(dir, `${sessionId}.jsonl`)
              if (fs.existsSync(candidate)) filePath = candidate
            }
          } else {
            filePath = findLatestTranscript(projectRoot)
          }

          if (!filePath) {
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ events: [], total: 0 }))
            return
          }
          const allEvents = loadTranscriptEvents(filePath)
          const total = allEvents.length

          let events: TimelineEvent[]
          if (before) {
            const end = parseInt(before, 10)
            const start = Math.max(0, end - tail)
            events = allEvents.slice(start, end)
          } else {
            events = allEvents.slice(-tail)
          }

          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ events, total }))
          return
        }

        // Multiplexed SSE — single connection for all sessions
        // ?sessions=id1,id2,id3
        if (url.pathname === '/api/agent-ops/timeline-stream-mux') {
          const sessionsCsv = url.searchParams.get('sessions') ?? ''
          const sessionIds = sessionsCsv.split(',').filter(Boolean)

          muxClients.add(res)
          const subs = new Set(sessionIds)
          clientSubscriptions.set(res, subs)

          for (const sid of sessionIds) watchSession(sid)

          res.setHeader('Content-Type', 'text/event-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')
          const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 30000)

          req.on('close', () => {
            muxClients.delete(res)
            clientSubscriptions.delete(res)
            for (const sid of subs) unwatchSessionIfOrphaned(sid)
            clearInterval(heartbeat)
          })
          return
        }

        // Legacy per-session SSE (kept for backward compat)
        if (url.pathname === '/api/agent-ops/timeline-stream') {
          const sessionId = url.searchParams.get('session')
          if (!sessionId) { res.statusCode = 400; res.end(); return }

          watchSession(sessionId)
          muxClients.add(res)
          clientSubscriptions.set(res, new Set([sessionId]))

          res.setHeader('Content-Type', 'text/event-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')
          const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 30000)

          req.on('close', () => {
            muxClients.delete(res)
            clientSubscriptions.delete(res)
            unwatchSessionIfOrphaned(sessionId)
            clearInterval(heartbeat)
          })
          return
        }

        // Existing: NDJSON SSE (kept)
        if (url.pathname === '/api/agent-ops/stream') {
          res.setHeader('Content-Type', 'text/event-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')

          const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 30000)
          req.on('close', () => clearInterval(heartbeat))
          return
        }

        next()
      })

      // --- Chat mode: Agent SDK session management via Vite WS ---

      const chatSessions = new Map<string, SDKSession>()

      // Broadcast to all connected clients (Phase A: single client)
      const wsBroadcast = (event: string, data: unknown) => {
        server.hot.send(event, data)
      }

      server.hot.on('chat:client', async (data: unknown, client: { send: (event: string, payload?: unknown) => void }) => {
        let msg: ChatWsClientMessage
        try {
          msg = (typeof data === 'string' ? JSON.parse(data) : data) as ChatWsClientMessage
        } catch { return }

        // Reply helper — sends to the requesting client
        const reply = (event: string, payload: unknown) => client.send(event, payload)

        if (msg.type === 'create-session') {
          try {
            const { unstable_v2_createSession } = await import('@anthropic-ai/claude-agent-sdk')
            const { randomUUID } = await import('node:crypto')
            const session = unstable_v2_createSession({
              model: 'claude-sonnet-4-6',
              permissionMode: 'acceptEdits',
              includePartialMessages: true,
            })

            // session.sessionId throws until first message — use our own UUID for routing
            const sessionId = randomUUID()
            chatSessions.set(sessionId, session)
            reply('chat:server', { type: 'session-created', sessionId, localId: msg.localId } satisfies ChatWsServerMessage)

          } catch (e) {
            reply('chat:server', { type: 'create-failed', error: String(e) } satisfies ChatWsServerMessage)
          }
          return
        }

        if (msg.type === 'send-message') {
          const sessionId = msg.sessionId
          const session = chatSessions.get(sessionId)
          if (!session) {
            reply('chat:server', { type: 'session-error', sessionId, error: 'Session not found' } satisfies ChatWsServerMessage)
            return
          }
          // Run one turn: send → stream → done
          ;(async () => {
            let currentText = ''
            try {
              await session.send(msg.text)
              for await (const sdkMsg of session.stream()) {
                handleSdkMessage(sessionId, sdkMsg, wsBroadcast, () => currentText, (t) => { currentText = t })
              }
            } catch (e) {
              if (chatSessions.has(sessionId)) {
                wsBroadcast('chat:server', { type: 'session-error', sessionId, error: String(e) } satisfies ChatWsServerMessage)
              }
            }
          })()
          return
        }

        if (msg.type === 'close-session') {
          const session = chatSessions.get(msg.sessionId)
          if (session) {
            session.close()
            chatSessions.delete(msg.sessionId)
            reply('chat:server', { type: 'session-closed', sessionId: msg.sessionId } satisfies ChatWsServerMessage)
          }
        }
      })

      // Cleanup
      const origClose = server.close.bind(server)
      server.close = async () => {
        for (const [id, session] of chatSessions) {
          session.close()
          chatSessions.delete(id)
        }
        return origClose()
      }
    },
  }
}

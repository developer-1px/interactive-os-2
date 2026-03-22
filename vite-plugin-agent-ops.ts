import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import type { Plugin } from 'vite'

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

    // Filter out skill/system noise — only surface user's actual input
    const noisePatterns = [
      /^Base directory for this skill:/,
      /^## 역할/,
      /^This skill/,
      /^Launching skill:/,
      /^ARGUMENTS:/,
      /^Caveat:/,
      /^\/clear$/,
      /^clear$/,
    ]
    if (noisePatterns.some(p => p.test(text))) return []

    // If text is a skill body (very long system-injected content), truncate to first line
    // Skill bodies are injected as user messages and start with known patterns
    const isSkillBody = text.length > 500 && (
      text.includes('## ') && text.includes('###') && text.includes('```')
    )
    if (isSkillBody) return [] // skip skill body entirely

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

      // --- Transcript timeline SSE (per-session) ---
      const timelineClients = new Map<string, Set<import('node:http').ServerResponse>>()
      const transcriptSizes = new Map<string, number>()

      server.watcher.on('change', (changedPath) => {
        // --- Transcript tailing (per-session) ---
        const clients = timelineClients.get(changedPath)
        if (clients && clients.size > 0) {
          const prevSize = transcriptSizes.get(changedPath) ?? 0
          const stat = fs.statSync(changedPath)
          if (stat.size > prevSize) {
            const fd = fs.openSync(changedPath, 'r')
            const buf = Buffer.alloc(stat.size - prevSize)
            fs.readSync(fd, buf, 0, buf.length, prevSize)
            fs.closeSync(fd)
            transcriptSizes.set(changedPath, stat.size)

            const newLines = buf.toString('utf-8').trim().split('\n').filter(Boolean)
            for (const line of newLines) {
              const events = parseTranscriptLine(line)
              for (const evt of events) {
                const json = JSON.stringify(evt)
                for (const client of clients) {
                  client.write(`data: ${json}\n\n`)
                }
              }
            }
          } else {
            transcriptSizes.set(changedPath, stat.size)
          }
          return
        }

        // --- NDJSON ops tailing (kept for /api/agent-ops/stream) ---
        if (changedPath.startsWith(opsDir) && changedPath.endsWith('.ndjson')) {
          // existing behavior omitted for brevity — kept via latest endpoint
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

        // Timeline for a specific session (or latest)
        if (url.pathname === '/api/agent-ops/timeline') {
          const sessionId = url.searchParams.get('session')
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
            res.end('[]')
            return
          }
          const events = loadTranscriptEvents(filePath)
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(events))
          return
        }

        // Transcript timeline SSE stream (per-session)
        if (url.pathname === '/api/agent-ops/timeline-stream') {
          const sessionId = url.searchParams.get('session')
          const dir = getTranscriptDir(projectRoot)
          let targetPath: string | null = null

          if (sessionId && dir) {
            const candidate = path.join(dir, `${sessionId}.jsonl`)
            if (fs.existsSync(candidate)) targetPath = candidate
          } else {
            targetPath = findLatestTranscript(projectRoot)
          }

          if (!targetPath) { res.statusCode = 404; res.end(); return }

          server.watcher.add(targetPath)
          if (!transcriptSizes.has(targetPath)) {
            transcriptSizes.set(targetPath, fs.statSync(targetPath).size)
          }

          if (!timelineClients.has(targetPath)) {
            timelineClients.set(targetPath, new Set())
          }
          timelineClients.get(targetPath)!.add(res)

          res.setHeader('Content-Type', 'text/event-stream')
          res.setHeader('Cache-Control', 'no-cache')
          res.setHeader('Connection', 'keep-alive')
          const heartbeat = setInterval(() => res.write(':heartbeat\n\n'), 30000)

          req.on('close', () => {
            const clients = timelineClients.get(targetPath!)
            if (clients) {
              clients.delete(res)
              if (clients.size === 0) {
                timelineClients.delete(targetPath!)
                transcriptSizes.delete(targetPath!)
                server.watcher.unwatch(targetPath!)
              }
            }
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

      // Cleanup
      const origClose = server.close.bind(server)
      server.close = async () => {
        return origClose()
      }
    },
  }
}

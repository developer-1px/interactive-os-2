// ② 2026-03-27-claude-chat-phase-a-prd.md
import { useSyncExternalStore } from 'react'
import type { ChatWsClientMessage } from './chatWsProtocol'
import type { ChatMessage } from '../../interactive-os/ui/chat/types'

// --- Per-session state ---

type ChatActivity = 'idle' | 'thinking' | 'executing' | 'streaming'

interface TurnUsage {
  input: number
  output: number
  costUsd: number
  durationMs: number
}

interface ChatSession {
  id: string
  messages: ChatMessage[]
  state: 'idle' | 'running' | 'requires_action'
  activity: ChatActivity
  streamingText: string
  thinkingText: string
  usage: TurnUsage | null
  sdkSessionId: string
  model: string
  commands: string[]
}

// --- Session helpers (SSOT for defaults + patch) ---

function defaultSession(id: string, overrides?: Partial<ChatSession>): ChatSession {
  return {
    id, messages: [], state: 'idle', activity: 'idle',
    streamingText: '', thinkingText: '', usage: null, sdkSessionId: '', model: '', commands: [],
    ...overrides,
  }
}

function patch(id: string, p: Partial<ChatSession>) {
  const s = S.sessions.get(id)
  if (!s) return
  S.sessions.set(id, { ...s, ...p })
  notify()
}

function pushMessage(id: string, msg: ChatMessage, extra?: Partial<ChatSession>) {
  const s = S.sessions.get(id)
  if (!s) return
  S.sessions.set(id, { ...s, ...extra, messages: [...s.messages, msg] })
  notify()
}

function makeMsg(role: ChatMessage['role'], content: string): ChatMessage {
  return { id: `${role}-${Date.now()}`, role, ts: Date.now(), blocks: [{ type: 'text', content }] }
}

function commitAccumulated(s: ChatSession): ChatMessage[] {
  const msgs: ChatMessage[] = []
  if (s.thinkingText) {
    msgs.push({
      id: `thinking-${Date.now()}`, role: 'assistant' as const, ts: Date.now(),
      blocks: [{ type: 'thinking', data: s.thinkingText }],
    })
  }
  if (s.streamingText) {
    msgs.push(makeMsg('assistant', s.streamingText))
  }
  return msgs
}

// --- Store state ---

interface ChatStoreState {
  sessions: Map<string, ChatSession>
  activeSessionId: string | null
  subs: Set<() => void>
  sessionsSnapshot: ChatSession[]
  activeSnapshot: ChatSession | null
}

// --- localStorage persistence ---

const STORAGE_KEY = 'chat-sessions'

interface PersistedSession { id: string; messages: ChatMessage[]; sdkSessionId: string; model: string }

function persist() {
  const data: PersistedSession[] = []
  for (const session of S.sessions.values()) {
    if (!session.sdkSessionId) continue
    data.push({ id: session.id, messages: session.messages, sdkSessionId: session.sdkSessionId, model: session.model })
  }
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ activeSessionId: S.activeSessionId, sessions: data }))
  } catch { /* quota exceeded */ }
}

function loadPersisted(): { activeSessionId: string | null; sessions: PersistedSession[] } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

// --- HMR-safe init ---

function getStore(): ChatStoreState {
  if (import.meta.hot?.data?.chatStore) return import.meta.hot.data.chatStore as ChatStoreState
  const state: ChatStoreState = {
    sessions: new Map(), activeSessionId: null, subs: new Set(),
    sessionsSnapshot: [], activeSnapshot: null,
  }
  if (import.meta.hot) import.meta.hot.data.chatStore = state
  return state
}

const S = getStore()

if (import.meta.hot) {
  import.meta.hot.dispose(() => { S.subs.clear() })
}

const subscribe = (cb: () => void) => {
  S.subs.add(cb)
  return () => { S.subs.delete(cb) }
}

function updateSnapshots() {
  S.sessionsSnapshot = [...S.sessions.values()]
  S.activeSnapshot = S.activeSessionId ? S.sessions.get(S.activeSessionId) ?? null : null
}

let persistTimer: ReturnType<typeof setTimeout> | null = null

function debouncedPersist() {
  if (persistTimer) return
  persistTimer = setTimeout(() => { persistTimer = null; persist() }, 2000)
}

function notify() {
  updateSnapshots()
  debouncedPersist()
  for (const cb of S.subs) cb()
}

// --- ID mapping: local ↔ server ---

const localToServer = new Map<string, string>()
const serverToLocal = new Map<string, string>()

function resolveLocal(serverSessionId: string): string {
  return serverToLocal.get(serverSessionId) ?? serverSessionId
}

function dropNextActive() {
  S.activeSessionId = S.sessions.size > 0 ? S.sessions.keys().next().value ?? null : null
}

// --- SDK message handler map (OCP: new type = new entry) ---

type SdkMsg = { type: string; [k: string]: unknown }

const sdkHandlers: Record<string, (id: string, msg: SdkMsg) => void> = {
  stream_event(id, msg) {
    const evt = msg.event as {
      type: string
      content_block?: { type: string; name?: string }
      delta?: { type: string; text?: string; thinking?: string }
    } | undefined
    if (!evt) return

    if (evt.type === 'content_block_start' && evt.content_block?.type === 'tool_use') {
      patch(id, { activity: 'executing' })
      return
    }

    if (evt.type !== 'content_block_delta' || !evt.delta) return
    const { delta } = evt
    if (delta.type === 'text_delta' && delta.text) {
      const s = S.sessions.get(id)
      if (s) patch(id, { activity: 'streaming', streamingText: s.streamingText + delta.text })
    }
    if (delta.type === 'thinking_delta' && delta.thinking) {
      const s = S.sessions.get(id)
      if (s) patch(id, { activity: 'thinking', thinkingText: s.thinkingText + delta.thinking })
    }
  },

  assistant(id, msg) {
    const s = S.sessions.get(id)
    if (!s) return

    const newMessages: ChatMessage[] = commitAccumulated(s)

    const content = (msg.message as { content?: { type: string; name?: string; input?: unknown; text?: string }[] } | undefined)?.content
    if (content) {
      const toolBlocks = content.filter(b => b.type === 'tool_use')
      if (toolBlocks.length > 0) {
        newMessages.push({
          id: `tools-${Date.now()}`, role: 'system' as const, ts: Date.now(),
          blocks: toolBlocks.map(b => ({
            type: 'tool_use' as const,
            data: { name: b.name, input: b.input },
          })),
        })
      }

      // Fallback: SDK may not stream text, extract from committed content
      if (!s.streamingText) {
        const text = content.filter(b => b.type === 'text' && b.text).map(b => b.text).join('')
        if (text) newMessages.push(makeMsg('assistant', text))
      }
    }

    // Agent loop: tool_use means more turns coming
    const hasToolUse = newMessages.some(m => m.blocks.some(b => b.type === 'tool_use'))
    const nextState = hasToolUse
      ? { state: 'running' as const, activity: 'executing' as const }
      : { state: 'idle' as const, activity: 'idle' as const }

    if (newMessages.length > 0) {
      S.sessions.set(id, {
        ...s,
        ...nextState, streamingText: '', thinkingText: '',
        messages: [...s.messages, ...newMessages],
      })
      notify()
    } else {
      patch(id, { ...nextState, streamingText: '', thinkingText: '' })
    }
  },

  // SDK echoes user messages back — contains tool_result → append to last tool message
  user(id, msg) {
    const content = (msg.message as { content?: unknown } | undefined)?.content
    if (!Array.isArray(content)) return
    const results = content.filter((b: { type?: string }) => b.type === 'tool_result')
    if (results.length === 0) return

    const s = S.sessions.get(id)
    if (!s) return

    const resultBlocks = results.map((b: { content?: unknown }) => ({
      type: 'tool_result' as const,
      data: b.content,
    }))

    const msgs = [...s.messages]
    for (let i = msgs.length - 1; i >= 0; i--) {
      if (msgs[i].role === 'system' && msgs[i].blocks.some(b => b.type === 'tool_use')) {
        msgs[i] = { ...msgs[i], blocks: [...msgs[i].blocks, ...resultBlocks] }
        S.sessions.set(id, { ...s, messages: msgs })
        notify()
        return
      }
    }

    // Fallback: no matching tool message found, push as separate
    pushMessage(id, {
      id: `result-${Date.now()}`, role: 'system' as const, ts: Date.now(),
      blocks: resultBlocks,
    })
  },

  tool_progress(id, _msg) {
    patch(id, { activity: 'executing' })
  },

  tool_use_summary(id, msg) {
    const summary = (msg.summary as string) ?? ''
    if (summary) {
      pushMessage(id, {
        id: `tool-${Date.now()}`, role: 'system', ts: Date.now(),
        blocks: [{ type: 'tool_summary', data: summary }],
      }, { activity: 'executing' })
    }
  },

  result(id, msg) {
    const usage = msg.usage as { input_tokens?: number; output_tokens?: number } | undefined
    patch(id, {
      state: 'idle', activity: 'idle',
      usage: {
        input: usage?.input_tokens ?? 0,
        output: usage?.output_tokens ?? 0,
        costUsd: (msg.total_cost_usd as number) ?? 0,
        durationMs: (msg.duration_ms as number) ?? 0,
      },
    })
  },

  system(id, msg) {
    if (msg.subtype === 'init' && msg.model) {
      patch(id, { model: msg.model as string })
    }
    if (msg.subtype === 'session_state_changed') {
      patch(id, { state: msg.state as ChatSession['state'] })
    }
  },
}

// --- WS connection ---

function setupWs() {
  if (!import.meta.hot) return

  import.meta.hot.on('chat:server', (data: unknown) => {
    let msg: Record<string, unknown>
    try { msg = (typeof data === 'string' ? JSON.parse(data) : data) as Record<string, unknown> } catch { return }
    const t = msg.type as string
    const sid = msg.sessionId as string

    // SDK bypass envelope — dispatch to handler map
    if (t === 'sdk') {
      const sdkMsg = msg.msg as SdkMsg
      const handler = sdkHandlers[sdkMsg.type]
      if (handler) handler(resolveLocal(sid), sdkMsg)
      return
    }

    // Session lifecycle messages
    if (t === 'session-created') {
      const localId = msg.localId as string
      const local = S.sessions.get(localId)
      if (local) {
        localToServer.set(localId, sid)
        serverToLocal.set(sid, localId)
      }
      return
    }

    if (t === 'session-ready') {
      const commands = msg.commands as string[] | undefined
      patch(resolveLocal(sid), {
        sdkSessionId: msg.sdkSessionId as string,
        ...(commands ? { commands } : {}),
      })
      return
    }

    if (t === 'session-closed') {
      const localId = resolveLocal(sid)
      if (!S.sessions.has(localId)) return
      S.sessions.delete(localId)
      if (S.activeSessionId === localId) dropNextActive()
      localToServer.delete(localId)
      serverToLocal.delete(sid)
      notify()
      return
    }

    if (t === 'session-interrupted') {
      const localId = resolveLocal(sid)
      const s = S.sessions.get(localId)
      if (!s) return
      const committed = commitAccumulated(s)
      S.sessions.set(localId, {
        ...s,
        state: 'idle', activity: 'idle', streamingText: '', thinkingText: '',
        messages: [...s.messages, ...committed],
      })
      notify()
      return
    }

    if (t === 'system-message') {
      pushMessage(resolveLocal(sid), makeMsg('system', msg.text as string), { state: 'idle', activity: 'idle' })
      return
    }

    if (t === 'create-failed') {
      console.error('[chat] create failed:', msg.error)
      return
    }

    if (t === 'resume-failed') {
      const failedLocalId = msg.localId as string
      console.error('[chat] resume failed:', msg.error)
      S.sessions.delete(failedLocalId)
      if (S.activeSessionId === failedLocalId) dropNextActive()
      notify()
      return
    }

    if (t === 'session-error') {
      console.error('[chat]', msg.error)
      pushMessage(resolveLocal(sid), makeMsg('system', msg.error as string), { state: 'idle', activity: 'idle' })
    }
  })
}

setupWs()

// --- Restore persisted sessions ---

function restoreSessions() {
  if (S.sessions.size > 0) return
  const persisted = loadPersisted()
  if (!persisted || persisted.sessions.length === 0) return

  for (const ps of persisted.sessions) {
    S.sessions.set(ps.id, defaultSession(ps.id, { messages: ps.messages, sdkSessionId: ps.sdkSessionId, model: ps.model || '' }))
    wsSend({ type: 'resume-session', localId: ps.id, sdkSessionId: ps.sdkSessionId })
  }
  S.activeSessionId = persisted.activeSessionId && S.sessions.has(persisted.activeSessionId)
    ? persisted.activeSessionId
    : S.sessions.keys().next().value ?? null
  updateSnapshots()
}

restoreSessions()

// --- Actions ---

function wsSend(msg: ChatWsClientMessage): boolean {
  if (!import.meta.hot) return false
  import.meta.hot.send('chat:client', msg)
  return true
}

let sessionCounter = 0

export function createSession(): string {
  const localId = `session-${++sessionCounter}-${Date.now().toString(36)}`
  S.sessions.set(localId, defaultSession(localId))
  S.activeSessionId = localId
  notify()
  wsSend({ type: 'create-session', localId })
  return localId
}

export function sendMessage(sessionId: string, text: string) {
  const session = S.sessions.get(sessionId)
  if (!session) return
  const serverId = localToServer.get(sessionId)
  if (!serverId || !wsSend({ type: 'send-message', sessionId: serverId, text })) {
    pushMessage(sessionId, makeMsg('system', 'Not connected to server. Please refresh the page.'), { state: 'idle', activity: 'idle' })
    return
  }
  pushMessage(sessionId, makeMsg('user', text), { state: 'running', activity: 'thinking', thinkingText: '', usage: null })
  // Timeout: if no SDK response within 30s, assume connection lost
  const timeoutId = setTimeout(() => {
    const s = S.sessions.get(sessionId)
    if (s?.state === 'running' && !s.thinkingText && !s.streamingText && s.messages[s.messages.length - 1]?.role === 'user') {
      pushMessage(sessionId, makeMsg('system', 'No response from server. The connection may have been lost.'), { state: 'idle', activity: 'idle' })
    }
  }, 30_000)
  // Clear timeout when any SDK message arrives for this session
  const unsub = subscribe(() => {
    const s = S.sessions.get(sessionId)
    if (!s || s.state !== 'running' || s.thinkingText || s.streamingText) {
      clearTimeout(timeoutId)
      unsub()
    }
  })
}

export function setModel(sessionId: string, model: string | undefined) {
  const serverId = localToServer.get(sessionId)
  if (serverId) wsSend({ type: 'set-model', sessionId: serverId, model })
  if (model) patch(sessionId, { model })
}

export function interruptSession(sessionId: string) {
  const session = S.sessions.get(sessionId)
  if (!session || session.state !== 'running') return
  const serverId = localToServer.get(sessionId)
  if (serverId) wsSend({ type: 'interrupt-session', sessionId: serverId })
}

export function clearSession(sessionId: string) {
  const serverId = localToServer.get(sessionId)
  if (serverId) {
    wsSend({ type: 'close-session', sessionId: serverId })
    localToServer.delete(sessionId)
    serverToLocal.delete(serverId)
  }
  S.sessions.set(sessionId, defaultSession(sessionId))
  notify()
  wsSend({ type: 'create-session', localId: sessionId })
}

export function closeSession(sessionId: string) {
  const serverId = localToServer.get(sessionId)
  S.sessions.delete(sessionId)
  if (S.activeSessionId === sessionId) dropNextActive()
  if (serverId) {
    localToServer.delete(sessionId)
    serverToLocal.delete(serverId)
    wsSend({ type: 'close-session', sessionId: serverId })
  }
  notify()
}

export function setActiveSession(sessionId: string) {
  S.activeSessionId = sessionId
  notify()
}

// --- React hooks ---

export function useActiveSession(): ChatSession | null {
  return useSyncExternalStore(subscribe, () => S.activeSnapshot)
}

export function useChatSessions(): ChatSession[] {
  return useSyncExternalStore(subscribe, () => S.sessionsSnapshot)
}

export function useChatSession(sessionId: string): ChatSession | null {
  return useSyncExternalStore(subscribe, () => S.sessions.get(sessionId) ?? null)
}

export type { ChatSession }

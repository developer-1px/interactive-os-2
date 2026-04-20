// ② 2026-03-27-claude-chat-phase-a-prd.md
import { useSyncExternalStore } from 'react'
import type { ChatWsClientMessage } from './chatWsProtocol'
import type { ChatMessage, ChatBlock } from '@os/ui/chat/types'

// --- Per-session state ---

type ChatActivity = 'idle' | 'thinking' | 'executing' | 'streaming'

interface TurnUsage {
  input: number
  output: number
  costUsd: number
  durationMs: number
}

export type ChatSessionKind = 'chat' | 'playground'

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
  kind: ChatSessionKind
}

// --- Session helpers (SSOT for defaults + patch) ---

function defaultSession(id: string, overrides?: Partial<ChatSession>): ChatSession {
  return {
    id, messages: [], state: 'idle', activity: 'idle',
    streamingText: '', thinkingText: '', usage: null, sdkSessionId: '', model: '', commands: [],
    kind: 'chat',
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
  return { id: `${role}-${Date.now()}`, role, ts: Date.now(), blocks: parseA2UIBlocks(content) }
}

/** Parse ```a2ui code blocks into mixed TextBlock + DataBlock(a2ui) sequences */
function parseA2UIBlocks(text: string): ChatBlock[] {
  const blocks: ChatBlock[] = []
  const regex = /```a2ui\s*\n([\s\S]*?)```/g
  let lastIndex = 0
  let match: RegExpExecArray | null

  while ((match = regex.exec(text)) !== null) {
    // Text before the code block
    const before = text.slice(lastIndex, match.index).trim()
    if (before) blocks.push({ type: 'text', content: before })

    // Parse JSON → A2UI DataBlock
    try {
      const payload = JSON.parse(match[1])
      if (payload?.components) {
        blocks.push({ type: 'a2ui', data: payload })
      } else {
        blocks.push({ type: 'code', content: match[1], language: 'json' })
      }
    } catch {
      blocks.push({ type: 'code', content: match[1], language: 'json' })
    }

    lastIndex = match.index + match[0].length
  }

  // Remaining text after last code block
  const after = text.slice(lastIndex).trim()
  if (after) blocks.push({ type: 'text', content: after })

  // No a2ui blocks found — return plain text
  if (blocks.length === 0) blocks.push({ type: 'text', content: text })

  return blocks
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

interface PersistedSession { id: string; messages: ChatMessage[]; sdkSessionId: string; model: string; kind: ChatSessionKind }

function persist() {
  const data: PersistedSession[] = []
  for (const session of S.sessions.values()) {
    if (!session.sdkSessionId) continue
    data.push({ id: session.id, messages: session.messages, sdkSessionId: session.sdkSessionId, model: session.model, kind: session.kind })
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
  if (import.meta.hot?.data) import.meta.hot.data.chatStore = state
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

// --- WS connection (delegated to chatSdkHandlers + chatWsConnection) ---

import { createSdkHandlers } from './chatSdkHandlers'
import { setupWs } from './chatWsConnection'

const sdkHandlers = createSdkHandlers({
  sessions: S.sessions, patch, pushMessage, makeMsg, commitAccumulated, notify,
})

setupWs({
  sessions: S.sessions,
  getActiveSessionId: () => S.activeSessionId,
  patch, pushMessage, makeMsg, commitAccumulated, notify, dropNextActive,
  localToServer, serverToLocal, resolveLocal,
}, sdkHandlers)

// --- Restore persisted sessions ---

function restoreSessions() {
  if (S.sessions.size > 0) return
  const persisted = loadPersisted()
  if (!persisted || persisted.sessions.length === 0) return

  for (const ps of persisted.sessions) {
    const kind: ChatSessionKind = ps.kind ?? 'chat'
    S.sessions.set(ps.id, defaultSession(ps.id, { messages: ps.messages, sdkSessionId: ps.sdkSessionId, model: ps.model || '', kind }))
    wsSend({ type: 'resume-session', localId: ps.id, sdkSessionId: ps.sdkSessionId, kind })
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

export function hasSession(id: string): boolean {
  return S.sessions.has(id)
}

export function createSession(opts?: { kind?: ChatSessionKind; setActive?: boolean }): string {
  const kind: ChatSessionKind = opts?.kind ?? 'chat'
  const setActive = opts?.setActive ?? true
  const localId = `session-${++sessionCounter}-${Date.now().toString(36)}`
  S.sessions.set(localId, defaultSession(localId, { kind }))
  if (setActive) S.activeSessionId = localId
  notify()
  wsSend({ type: 'create-session', localId, kind })
  return localId
}

/** kind 싱글톤 ensure — 같은 kind 세션이 있으면 재사용, 없으면 새로 생성. playground 라우트용. */
export function ensureSession(kind: ChatSessionKind): string {
  for (const s of S.sessions.values()) {
    if (s.kind === kind) return s.id
  }
  return createSession({ kind, setActive: false })
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

// ② 2026-03-27-claude-chat-phase-a-prd.md
import { useSyncExternalStore } from 'react'
import type { ChatWsClientMessage, ChatWsServerMessage } from './chatWsProtocol'
import type { ChatMessage } from '../../interactive-os/ui/chat/types'

// --- Per-session state ---

interface ChatSession {
  id: string
  messages: ChatMessage[]
  state: 'idle' | 'running' | 'requires_action'
  streamingText: string
}

// --- Store state ---

interface ChatStoreState {
  sessions: Map<string, ChatSession>
  activeSessionId: string | null
  subs: Set<() => void>
  // Cached snapshots for referential stability
  sessionsSnapshot: ChatSession[]
  activeSnapshot: ChatSession | null
}

// --- HMR-safe init ---

function getStore(): ChatStoreState {
  if (import.meta.hot?.data?.chatStore) {
    return import.meta.hot.data.chatStore as ChatStoreState
  }
  const state: ChatStoreState = {
    sessions: new Map(),
    activeSessionId: null,
    subs: new Set(),
    sessionsSnapshot: [],
    activeSnapshot: null,
  }
  if (import.meta.hot) {
    import.meta.hot.data.chatStore = state
  }
  return state
}

const S = getStore()

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    S.subs.clear()
  })
}

// Stable subscribe function — shared by all hooks
const subscribe = (cb: () => void) => {
  S.subs.add(cb)
  return () => { S.subs.delete(cb) }
}

function updateSnapshots() {
  S.sessionsSnapshot = [...S.sessions.values()]
  S.activeSnapshot = S.activeSessionId
    ? S.sessions.get(S.activeSessionId) ?? null
    : null
}

function notify() {
  updateSnapshots()
  for (const cb of S.subs) cb()
}

// --- ID mapping: local ↔ server ---

const localToServer = new Map<string, string>()
const serverToLocal = new Map<string, string>()

function resolveLocal(serverSessionId: string): string {
  return serverToLocal.get(serverSessionId) ?? serverSessionId
}

// --- WS connection ---

function setupWs() {
  if (!import.meta.hot) return

  import.meta.hot.on('chat:server', (data: unknown) => {
    let msg: ChatWsServerMessage
    try {
      msg = (typeof data === 'string' ? JSON.parse(data) : data) as ChatWsServerMessage
    } catch { return }

    if (msg.type === 'session-created') {
      // Map local session to server SDK session ID
      const local = S.sessions.get(msg.localId)
      if (local) {
        localToServer.set(msg.localId, msg.sessionId)
        serverToLocal.set(msg.sessionId, msg.localId)
      }
      return
    }

    if (msg.type === 'assistant-text') {
      const localId = resolveLocal(msg.sessionId)
      const session = S.sessions.get(localId)
      if (!session) return
      S.sessions.set(localId, { ...session, streamingText: session.streamingText + msg.text })
      notify()
      return
    }

    if (msg.type === 'assistant-done') {
      const localId = resolveLocal(msg.sessionId)
      const session = S.sessions.get(localId)
      if (!session) return
      if (session.streamingText) {
        S.sessions.set(localId, {
          ...session,
          messages: [...session.messages, {
            id: `assistant-${Date.now()}`,
            role: 'assistant',
            ts: Date.now(),
            blocks: [{ type: 'text', content: session.streamingText }],
          }],
          streamingText: '',
        })
      }
      notify()
      return
    }

    if (msg.type === 'state-changed') {
      const localId = resolveLocal(msg.sessionId)
      const session = S.sessions.get(localId)
      if (session) {
        S.sessions.set(localId, { ...session, state: msg.state })
        notify()
      }
      return
    }

    if (msg.type === 'session-closed') {
      const localId = resolveLocal(msg.sessionId)
      if (!S.sessions.has(localId)) return // already closed locally
      S.sessions.delete(localId)
      if (S.activeSessionId === localId) {
        S.activeSessionId = S.sessions.size > 0 ? S.sessions.keys().next().value ?? null : null
      }
      localToServer.delete(localId)
      serverToLocal.delete(msg.sessionId)
      notify()
      return
    }

    if (msg.type === 'create-failed') {
      console.error('[chat] create failed:', msg.error)
      return
    }

    if (msg.type === 'session-error') {
      console.error('[chat]', msg.error)
    }
  })
}

setupWs()

// --- Actions ---

function wsSend(msg: ChatWsClientMessage) {
  if (!import.meta.hot) {
    console.warn('[chat] import.meta.hot not available — WS disabled')
    return
  }
  console.log('[chat] sending:', msg.type)
  import.meta.hot.send('chat:client', msg)
}

let sessionCounter = 0

export function createSession(): string {
  const localId = `session-${++sessionCounter}-${Date.now().toString(36)}`
  S.sessions.set(localId, {
    id: localId,
    messages: [],
    state: 'idle',
    streamingText: '',
  })
  S.activeSessionId = localId
  notify()
  wsSend({ type: 'create-session', localId })
  return localId
}

export function sendMessage(sessionId: string, text: string) {
  const session = S.sessions.get(sessionId)
  if (!session) return

  S.sessions.set(sessionId, {
    ...session,
    messages: [...session.messages, {
      id: `user-${Date.now()}`,
      role: 'user',
      ts: Date.now(),
      blocks: [{ type: 'text', content: text }],
    }],
  })
  notify()

  const serverId = localToServer.get(sessionId)
  if (serverId) {
    wsSend({ type: 'send-message', sessionId: serverId, text })
  }
}

export function closeSession(sessionId: string) {
  const serverId = localToServer.get(sessionId)
  S.sessions.delete(sessionId)
  if (S.activeSessionId === sessionId) {
    S.activeSessionId = S.sessions.size > 0 ? S.sessions.keys().next().value ?? null : null
  }
  if (serverId) {
    localToServer.delete(sessionId)
    serverToLocal.delete(serverId)
  }
  notify()
  if (serverId) {
    wsSend({ type: 'close-session', sessionId: serverId })
  }
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

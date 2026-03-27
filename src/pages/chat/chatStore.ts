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

// --- WS connection ---

function setupWs() {
  if (!import.meta.hot) return

  import.meta.hot.on('chat:server', (data: unknown) => {
    let msg: ChatWsServerMessage
    try {
      msg = (typeof data === 'string' ? JSON.parse(data) : data) as ChatWsServerMessage
    } catch { return }

    if (msg.type === 'session-created') {
      S.sessions.set(msg.sessionId, {
        id: msg.sessionId,
        messages: [],
        state: 'idle',
        streamingText: '',
      })
      S.activeSessionId = msg.sessionId
      notify()
      return
    }

    if (msg.type === 'assistant-text') {
      const session = S.sessions.get(msg.sessionId)
      if (!session) return
      // Replace session object for referential change detection
      S.sessions.set(msg.sessionId, { ...session, streamingText: session.streamingText + msg.text })
      notify()
      return
    }

    if (msg.type === 'assistant-done') {
      const session = S.sessions.get(msg.sessionId)
      if (!session) return
      if (session.streamingText) {
        S.sessions.set(msg.sessionId, {
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
      const session = S.sessions.get(msg.sessionId)
      if (session) {
        S.sessions.set(msg.sessionId, { ...session, state: msg.state })
        notify()
      }
      return
    }

    if (msg.type === 'session-closed') {
      S.sessions.delete(msg.sessionId)
      if (S.activeSessionId === msg.sessionId) {
        S.activeSessionId = S.sessions.size > 0 ? S.sessions.keys().next().value ?? null : null
      }
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
  if (!import.meta.hot) return
  import.meta.hot.send('chat:client', msg)
}

export function createSession() {
  wsSend({ type: 'create-session' })
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

  wsSend({ type: 'send-message', sessionId, text })
}

export function closeSession(sessionId: string) {
  wsSend({ type: 'close-session', sessionId })
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

export type { ChatSession }

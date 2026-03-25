import type { TimelineEvent } from './groupEvents'

type Listener = (evt: TimelineEvent) => void

// --- HMR-safe state ---
// Module variables reset on HMR. Use import.meta.hot.data to survive.

interface SSEState {
  es: EventSource | null
  listeners: Map<string, Set<Listener>>
  retryCount: number
  retryTimer: ReturnType<typeof setTimeout> | null
  gaveUp: boolean
  lastSessionsKey: string
}

const MAX_RETRIES = 3
const BASE_DELAY = 3000

function getState(): SSEState {
  // In HMR: reuse state from previous module version
  if (import.meta.hot?.data?.sseState) {
    return import.meta.hot.data.sseState as SSEState
  }
  const state: SSEState = {
    es: null,
    listeners: new Map(),
    retryCount: 0,
    retryTimer: null,
    gaveUp: false,
    lastSessionsKey: '',
  }
  if (import.meta.hot) {
    import.meta.hot.data.sseState = state
  }
  return state
}

const S = getState()

// HMR dispose: close old connection cleanly
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (S.retryTimer) { clearTimeout(S.retryTimer); S.retryTimer = null }
    if (S.es) { S.es.close(); S.es = null }
    S.gaveUp = false
    S.retryCount = 0
    S.lastSessionsKey = ''
    // Keep listeners — React components will re-subscribe with same refs
    // but clear the sets since callbacks point to stale closures
    for (const cbs of S.listeners.values()) cbs.clear()
  })
}

// --- Core logic ---

function sessionsKey(): string {
  return [...S.listeners.keys()].sort().join(',')
}

function ensureConnection() {
  if (S.es && S.es.readyState !== EventSource.CLOSED) return
  if (S.gaveUp) return

  const sessions = sessionsKey()
  if (!sessions) return

  S.es = new EventSource(`/api/agent-ops/timeline-stream-mux?sessions=${encodeURIComponent(sessions)}`)
  S.lastSessionsKey = sessions

  S.es.onopen = () => {
    S.retryCount = 0
    S.gaveUp = false
  }

  S.es.onmessage = (event) => {
    let data: Record<string, unknown>
    try { data = JSON.parse(event.data) } catch { return }
    const sessionId = data.session as string
    if (!sessionId) return
    delete data.session
    const cbs = S.listeners.get(sessionId)
    if (cbs) {
      for (const cb of cbs) cb(data as unknown as TimelineEvent)
    }
  }

  S.es.onerror = () => {
    if (S.es) { S.es.close(); S.es = null }

    S.retryCount++
    if (S.retryCount >= MAX_RETRIES) {
      S.gaveUp = true
      return
    }

    const delay = BASE_DELAY * Math.pow(2, S.retryCount - 1)
    if (S.retryTimer) clearTimeout(S.retryTimer)
    S.retryTimer = setTimeout(() => {
      S.retryTimer = null
      if (S.listeners.size > 0) ensureConnection()
    }, delay)
  }
}

function reconnectIfSessionsChanged() {
  const newKey = sessionsKey()

  if (newKey === S.lastSessionsKey && (S.es || S.gaveUp)) return

  if (S.retryTimer) { clearTimeout(S.retryTimer); S.retryTimer = null }
  S.retryCount = 0
  S.gaveUp = false

  if (S.es) { S.es.close(); S.es = null }
  if (newKey) ensureConnection()
}

export function subscribeTimeline(sessionId: string, onEvent: Listener): () => void {
  if (!S.listeners.has(sessionId)) {
    S.listeners.set(sessionId, new Set())
  }
  const cbs = S.listeners.get(sessionId)!
  cbs.add(onEvent)

  reconnectIfSessionsChanged()

  return () => {
    cbs.delete(onEvent)
    if (cbs.size === 0) {
      S.listeners.delete(sessionId)
      if (S.listeners.size === 0) {
        if (S.retryTimer) { clearTimeout(S.retryTimer); S.retryTimer = null }
        if (S.es) { S.es.close(); S.es = null }
        S.lastSessionsKey = ''
        S.gaveUp = false
        S.retryCount = 0
      } else {
        reconnectIfSessionsChanged()
      }
    }
  }
}

import type { TimelineEvent } from './types'

type Listener = (evt: TimelineEvent) => void

// Shared single SSE connection — watches all active sessions
let es: EventSource | null = null
const listeners = new Map<string, Set<Listener>>()

function ensureConnection() {
  if (es && es.readyState !== EventSource.CLOSED) return

  // Connect with all currently needed sessions
  const sessions = [...listeners.keys()].join(',')
  if (!sessions) return

  es = new EventSource(`/api/agent-ops/timeline-stream-mux?sessions=${encodeURIComponent(sessions)}`)

  es.onmessage = (event) => {
    let data: Record<string, unknown>
    try { data = JSON.parse(event.data) } catch { return }
    const sessionId = data.session as string
    if (!sessionId) return
    delete data.session
    const cbs = listeners.get(sessionId)
    if (cbs) {
      for (const cb of cbs) cb(data as unknown as TimelineEvent)
    }
  }

  es.onerror = () => {
    // EventSource auto-reconnects with same URL
  }
}

function reconnectWithUpdatedSessions() {
  if (es) {
    es.close()
    es = null
  }
  if (listeners.size > 0) {
    ensureConnection()
  }
}

export function subscribeTimeline(sessionId: string, onEvent: Listener): () => void {
  if (!listeners.has(sessionId)) {
    listeners.set(sessionId, new Set())
  }
  const cbs = listeners.get(sessionId)!
  const wasEmpty = cbs.size === 0
  cbs.add(onEvent)

  // Reconnect to include new session
  if (wasEmpty) {
    reconnectWithUpdatedSessions()
  }

  return () => {
    cbs.delete(onEvent)
    if (cbs.size === 0) {
      listeners.delete(sessionId)
      if (listeners.size === 0 && es) {
        es.close()
        es = null
      } else {
        // Reconnect without this session
        reconnectWithUpdatedSessions()
      }
    }
  }
}

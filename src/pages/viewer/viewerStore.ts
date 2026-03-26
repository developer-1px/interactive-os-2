// HMR-safe module-level store for agentViewer data.
// Data survives HMR via import.meta.hot.data. React subscribes via useSyncExternalStore.

import { useSyncExternalStore, useCallback } from 'react'
import type { TimelineEvent } from './groupEvents'
import { subscribeTimeline } from './timelineSSE'

// --- Constants ---

const INITIAL_TAIL = 80
const LOAD_MORE_CHUNK = 100
const IDLE_DELAY = 3000

// --- Per-session state ---

interface SessionState {
  timeline: TimelineEvent[]
  editRanges: Map<string, string[]>
  agentStatus: 'running' | 'idle' | 'done'
  runStartTs: number | null
  fetchError: string | null
  initialLoading: boolean
  loadedFrom: number
  loadingMore: boolean
  isLive: boolean
  idleTimer: ReturnType<typeof setTimeout> | null
  sseUnsubscribe: (() => void) | null
  ssePending: TimelineEvent[]
  sseRafId: number
  refCount: number
}

// --- Store state ---

interface StoreState {
  sessions: Map<string, SessionState>
  timelineSubs: Map<string, Set<() => void>>
  metaSubs: Map<string, Set<() => void>>
  filesSubs: Set<() => void>
}

// --- HMR-safe initialization ---

function getStore(): StoreState {
  if (import.meta.hot?.data?.viewerStore) {
    return import.meta.hot.data.viewerStore as StoreState
  }
  const state: StoreState = {
    sessions: new Map(),
    timelineSubs: new Map(),
    metaSubs: new Map(),
    filesSubs: new Set(),
  }
  if (import.meta.hot) {
    import.meta.hot.data.viewerStore = state
  }
  return state
}

const S = getStore()

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    // Clear subscriber callbacks (stale closures), keep data
    for (const subs of S.timelineSubs.values()) subs.clear()
    for (const subs of S.metaSubs.values()) subs.clear()
    S.filesSubs.clear()

    // Clear timers and SSE subscriptions (stale closures), keep data
    for (const session of S.sessions.values()) {
      if (session.idleTimer) { clearTimeout(session.idleTimer); session.idleTimer = null }
      if (session.sseUnsubscribe) { session.sseUnsubscribe(); session.sseUnsubscribe = null }
      if (session.sseRafId) { cancelAnimationFrame(session.sseRafId); session.sseRafId = 0 }
      session.ssePending = []
      session.refCount = 0
    }
  })
}

// --- Notify helpers ---

function notifyTimeline(sessionId: string) {
  const subs = S.timelineSubs.get(sessionId)
  if (subs) for (const cb of subs) cb()
}

function notifyMeta(sessionId: string) {
  const subs = S.metaSubs.get(sessionId)
  if (subs) for (const cb of subs) cb()
}

function notifyFiles() {
  for (const cb of S.filesSubs) cb()
}

// --- Session lifecycle ---

function createSession(sessionId: string, isLive: boolean): SessionState {
  const session: SessionState = {
    timeline: [],
    editRanges: new Map(),
    agentStatus: isLive ? 'idle' : 'done',
    runStartTs: null,
    fetchError: null,
    initialLoading: true,
    loadedFrom: 0,
    loadingMore: false,
    isLive,
    idleTimer: null,
    sseUnsubscribe: null,
    ssePending: [],
    sseRafId: 0,
    refCount: 0,
  }
  S.sessions.set(sessionId, session)
  return session
}

function fetchInitial(sessionId: string, session: SessionState) {
  fetch(`/api/agent-ops/timeline?session=${encodeURIComponent(sessionId)}&tail=${INITIAL_TAIL}`)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    .then((data: { events: TimelineEvent[]; total: number }) => {
      session.editRanges = new Map()
      trackEditRanges(session, data.events)
      session.timeline = data.events
      session.loadedFrom = Math.max(0, data.total - data.events.length)
      session.fetchError = null
      session.initialLoading = false
      notifyTimeline(sessionId)
      notifyMeta(sessionId)

      // Infer initial status from last event
      if (session.isLive && data.events.length > 0) {
        const last = data.events[data.events.length - 1]
        if (last.type === 'user' || last.type === 'tool_use' || last.type === 'tool_result') {
          markRunning(sessionId, session)
        }
      }
    })
    .catch(e => {
      session.fetchError = e.message
      session.initialLoading = false
      notifyMeta(sessionId)
    })
}

function startSSE(sessionId: string, session: SessionState) {
  if (!session.isLive || session.sseUnsubscribe) return

  session.sseUnsubscribe = subscribeTimeline(sessionId, (evt) => {
    session.ssePending.push(evt)

    // Update status immediately (lightweight)
    if (evt.type === 'user' || evt.type === 'tool_use' || evt.type === 'tool_result') {
      markRunning(sessionId, session)
    } else if (evt.type === 'assistant') {
      scheduleIdle(sessionId, session)
    }

    // Batch timeline updates with rAF
    if (!session.sseRafId) {
      session.sseRafId = requestAnimationFrame(() => flushSSE(sessionId))
    }
  })
}

function flushSSE(sessionId: string) {
  const session = S.sessions.get(sessionId)
  if (!session) return
  session.sseRafId = 0
  if (session.ssePending.length === 0) return

  const batch = session.ssePending
  session.ssePending = []

  trackEditRanges(session, batch)
  session.timeline = [...session.timeline, ...batch]

  notifyTimeline(sessionId)
}

// --- Agent status state machine ---

function markRunning(sessionId: string, session: SessionState) {
  const changed = session.agentStatus !== 'running' || session.runStartTs === null
  session.agentStatus = 'running'
  if (session.runStartTs === null) session.runStartTs = Date.now()
  if (session.idleTimer) { clearTimeout(session.idleTimer); session.idleTimer = null }
  if (changed) notifyMeta(sessionId)
}

function scheduleIdle(sessionId: string, session: SessionState) {
  if (session.idleTimer) clearTimeout(session.idleTimer)
  session.idleTimer = setTimeout(() => {
    session.idleTimer = null
    session.agentStatus = 'idle'
    session.runStartTs = null
    notifyMeta(sessionId)
  }, IDLE_DELAY)
}

// --- Edit ranges tracking ---

function trackEditRanges(session: SessionState, events: TimelineEvent[]) {
  let newFile = false
  for (const evt of events) {
    if (evt.type !== 'tool_use') continue
    if ((evt.tool === 'Edit' || evt.tool === 'Write') && evt.filePath) {
      const existing = session.editRanges.get(evt.filePath)
      if (existing) {
        if (evt.editNew) existing.push(evt.editNew)
      } else {
        session.editRanges.set(evt.filePath, evt.editNew ? [evt.editNew] : [])
        newFile = true
      }
    }
  }
  if (newFile) notifyFiles()
}

// --- Public API: session lifecycle ---

export function connectSession(sessionId: string, isLive: boolean): void {
  let session = S.sessions.get(sessionId)

  if (session) {
    session.refCount++
    session.isLive = isLive
    // HMR recovery: data exists, just re-connect SSE
    if (!session.sseUnsubscribe && isLive) {
      startSSE(sessionId, session)
    }
    if (!isLive && session.agentStatus !== 'done') {
      session.agentStatus = 'done'
      session.runStartTs = null
      if (session.idleTimer) { clearTimeout(session.idleTimer); session.idleTimer = null }
      notifyMeta(sessionId)
    }
    return
  }

  session = createSession(sessionId, isLive)
  session.refCount = 1
  fetchInitial(sessionId, session)
  if (isLive) startSSE(sessionId, session)
}

export function disconnectSession(sessionId: string): void {
  const session = S.sessions.get(sessionId)
  if (!session) return

  session.refCount--
  if (session.refCount > 0) return

  // Cleanup subscriptions and timers, keep data for modified files sidebar
  if (session.idleTimer) { clearTimeout(session.idleTimer); session.idleTimer = null }
  if (session.sseUnsubscribe) { session.sseUnsubscribe(); session.sseUnsubscribe = null }
  if (session.sseRafId) { cancelAnimationFrame(session.sseRafId); session.sseRafId = 0 }
  session.ssePending = []
  metaCache.delete(sessionId)
}

// --- Public API: actions ---

export function loadOlder(sessionId: string): void {
  const session = S.sessions.get(sessionId)
  if (!session || session.loadingMore || session.loadedFrom <= 0) return
  session.loadingMore = true

  const before = session.loadedFrom
  fetch(`/api/agent-ops/timeline?session=${encodeURIComponent(sessionId)}&tail=${LOAD_MORE_CHUNK}&before=${before}`)
    .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
    .then((data: { events: TimelineEvent[]; total: number }) => {
      if (data.events.length > 0) {
        trackEditRanges(session, data.events)
        session.timeline = [...data.events, ...session.timeline]
        session.loadedFrom = Math.max(0, before - data.events.length)
        notifyTimeline(sessionId)
      }
    })
    .catch(() => { session.loadedFrom = 0 })
    .finally(() => { session.loadingMore = false })
}

export function canLoadMore(sessionId: string): boolean {
  const session = S.sessions.get(sessionId)
  return session != null && session.loadedFrom > 0 && !session.loadingMore
}

export function getEditRanges(sessionId: string, filePath: string): string[] | undefined {
  return S.sessions.get(sessionId)?.editRanges.get(filePath)
}

// --- Snapshots (stable references for useSyncExternalStore) ---

const EMPTY_TIMELINE: TimelineEvent[] = []

export interface SessionMeta {
  agentStatus: 'running' | 'idle' | 'done'
  runStartTs: number | null
  fetchError: string | null
  initialLoading: boolean
}

const DEFAULT_META: SessionMeta = { agentStatus: 'done', runStartTs: null, fetchError: null, initialLoading: true }

// Cache meta snapshots to avoid unnecessary re-renders
const metaCache = new Map<string, SessionMeta>()

function getMetaSnapshot(sessionId: string): SessionMeta {
  const session = S.sessions.get(sessionId)
  if (!session) return DEFAULT_META

  const cached = metaCache.get(sessionId)
  if (cached &&
    cached.agentStatus === session.agentStatus &&
    cached.runStartTs === session.runStartTs &&
    cached.fetchError === session.fetchError &&
    cached.initialLoading === session.initialLoading
  ) return cached

  const meta: SessionMeta = {
    agentStatus: session.agentStatus,
    runStartTs: session.runStartTs,
    fetchError: session.fetchError,
    initialLoading: session.initialLoading,
  }
  metaCache.set(sessionId, meta)
  return meta
}

// Cache files snapshot
let filesCache: string[] = []
let filesCacheKey = ''

function getFilesSnapshot(): string[] {
  const allFiles = new Set<string>()
  for (const session of S.sessions.values()) {
    for (const path of session.editRanges.keys()) allFiles.add(path)
  }
  const sorted = [...allFiles].sort()
  const key = sorted.join('\n')
  if (key === filesCacheKey) return filesCache
  filesCacheKey = key
  filesCache = sorted
  return filesCache
}

// --- React hooks ---

export function useTimeline(sessionId: string): TimelineEvent[] {
  const subscribe = useCallback((cb: () => void) => {
    if (!S.timelineSubs.has(sessionId)) S.timelineSubs.set(sessionId, new Set())
    S.timelineSubs.get(sessionId)!.add(cb)
    return () => { S.timelineSubs.get(sessionId)?.delete(cb) }
  }, [sessionId])

  const getSnapshot = useCallback(
    () => S.sessions.get(sessionId)?.timeline ?? EMPTY_TIMELINE,
    [sessionId],
  )

  return useSyncExternalStore(subscribe, getSnapshot)
}

export function useSessionMeta(sessionId: string): SessionMeta {
  const subscribe = useCallback((cb: () => void) => {
    if (!S.metaSubs.has(sessionId)) S.metaSubs.set(sessionId, new Set())
    S.metaSubs.get(sessionId)!.add(cb)
    return () => { S.metaSubs.get(sessionId)?.delete(cb) }
  }, [sessionId])

  const getSnapshot = useCallback(() => getMetaSnapshot(sessionId), [sessionId])

  return useSyncExternalStore(subscribe, getSnapshot)
}

export function useAllModifiedFiles(): string[] {
  const subscribe = useCallback((cb: () => void) => {
    S.filesSubs.add(cb)
    return () => { S.filesSubs.delete(cb) }
  }, [])

  return useSyncExternalStore(subscribe, getFilesSnapshot)
}

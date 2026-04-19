// ② replayV2BeatPrd
// @useState-hatch — allMessages: async replay data per slot
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createStore } from '@os/store/createStore'
import type { NormalizedData } from '@os/store/types'
import type { ChatMessage } from '@os/ui/chat/types'
import { ax } from '@styles/ax'
import { parseJsonl } from './parseJsonl'
import { useViewerTabs } from './useViewerTabs'
import type { FileViewerHandle, ViewerTab } from '@os/ui/viewerTypes'
import { ReplayProvider, type ReplayContextValue } from './replayContext'
import { ReplayStageWidget, ReplaySidebarWidget } from './replayWidgets'
import { useActiveSessions } from './useActiveSessions'
import { useSubAgentSessions } from './useSubAgentSessions'
import { matchSubAgents } from './matchSubAgents'
import { SubAgentStageWidget } from './SubAgentStageWidget'
import { useTimeline } from '../viewer/viewerStore'
import type { SubAgentFile } from './subAgentTypes'

// ── Session loading ──

interface SessionFile {
  id: string
  model: string
  messages: ChatMessage[]
}

const jsonLoaders = import.meta.glob<SessionFile>('./sessions/*.json', { import: 'default' })
const jsonlLoaders = import.meta.glob<string>('./sessions/*.jsonl', { query: '?raw', import: 'default' })

interface SessionEntry { id: string; type: 'json' | 'jsonl' }

const sessionEntries: SessionEntry[] = [
  ...Object.keys(jsonLoaders).map(path => ({
    id: path.match(/\/([^/]+)\.json$/)?.[1] ?? path,
    type: 'json' as const,
  })),
  ...Object.keys(jsonlLoaders).map(path => ({
    id: path.match(/\/([^/]+)\.jsonl$/)?.[1] ?? path,
    type: 'jsonl' as const,
  })),
]

function tabLabel(tab: ViewerTab): string {
  switch (tab.type) {
    case 'file': {
      const parts = (tab.path ?? 'output').split('/')
      return parts[parts.length - 1] || 'output'
    }
    case 'search': return 'Search'
    case 'terminal': return 'Terminal'
  }
}

// ── Per-session slot ──

type RegisterCtx = (index: number, ctx: ReplayContextValue | null) => void

function ReplaySlot({ entry, index, register }: { entry: SessionEntry; index: number; register: RegisterCtx }) {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([])

  const viewerTabs = useViewerTabs()
  const fileViewerRef = useRef<FileViewerHandle>(null)

  // Load session data — jsonl/json directly into allMessages, ShortCard renders via toBeats
  useEffect(() => {
    let cancelled = false
    async function load() {
      if (entry.type === 'json') {
        const path = `./sessions/${entry.id}.json`
        const loader = jsonLoaders[path]
        if (!loader) return
        const session = await loader()
        if (!cancelled) setAllMessages(session.messages)
      } else {
        const path = `./sessions/${entry.id}.jsonl`
        const loader = jsonlLoaders[path]
        if (!loader) return
        const raw = await loader()
        if (!cancelled) setAllMessages(parseJsonl(raw).messages)
      }
    }
    load()
    return () => { cancelled = true }
  }, [entry.id, entry.type])

  const { tabs, activeTab, activeTabId, setActiveTab } = viewerTabs

  const viewerTabData: NormalizedData = useMemo(() => {
    if (tabs.length === 0) return createStore({ entities: {}, relationships: {} })
    const entities = Object.fromEntries(tabs.map(t => [t.id, { id: t.id, data: { label: tabLabel(t), type: t.type } }]))
    return createStore({ entities, relationships: { __root__: tabs.map(t => t.id) } })
  }, [tabs])

  const noop = useCallback(() => {}, [])

  const replayCtx = useMemo<ReplayContextValue>(() => ({
    selectedId: entry.id,
    setSelectedId: noop,
    sessionEntries,
    messages: allMessages,
    allMessagesCount: allMessages.length,
    isRunning: false,
    startReplay: noop,
    editingLine: null,
    mode: 'replay',
    tabs,
    activeTab,
    activeTabId,
    setActiveTab,
    viewerTabData,
    fileViewerRef,
    viewerTabs,
  }), [entry.id, noop, allMessages, tabs, activeTab, activeTabId, setActiveTab, viewerTabData, viewerTabs])

  useEffect(() => {
    register(index, replayCtx)
    return () => register(index, null)
  }, [index, replayCtx, register])

  return (
    <ReplayProvider value={replayCtx}>
      <ReplayStageWidget />
    </ReplayProvider>
  )
}

// ── Live slot: renders the Shorts stage driven by the active agent session ──

function LiveSlot({ slotIndex, sessionId, parentActive, subagentFiles, register }: {
  slotIndex: number
  sessionId: string | null
  parentActive: boolean
  subagentFiles: SubAgentFile[]
  register: RegisterCtx
}) {
  const viewerTabs = useViewerTabs()
  const fileViewerRef = useRef<FileViewerHandle>(null)
  const { tabs, activeTab, activeTabId, setActiveTab } = viewerTabs

  // SubAgent 구독 (Live 모드에서만)
  const parentEvents = useTimeline(sessionId ?? '')
  const subagents = useSubAgentSessions({
    parentSessionId: sessionId ?? '',
    parentActive,
    parentEvents,
    subagentFiles,
  })
  const subAgentMatches = useMemo(
    () => matchSubAgents({ parentEvents, subagents }),
    [parentEvents, subagents],
  )

  const viewerTabData: NormalizedData = useMemo(() => {
    if (tabs.length === 0) return createStore({ entities: {}, relationships: {} })
    const entities = Object.fromEntries(tabs.map(t => [t.id, { id: t.id, data: { label: tabLabel(t), type: t.type } }]))
    return createStore({ entities, relationships: { __root__: tabs.map(t => t.id) } })
  }, [tabs])

  const noop = useCallback(() => {}, [])

  const ctx = useMemo<ReplayContextValue>(() => ({
    selectedId: sessionId ?? '__live__',
    setSelectedId: noop,
    sessionEntries,
    messages: [],
    allMessagesCount: 0,
    isRunning: false,
    startReplay: noop,
    editingLine: null,
    mode: 'live',
    liveSessionId: sessionId,
    tabs,
    activeTab,
    activeTabId,
    setActiveTab,
    viewerTabData,
    fileViewerRef,
    viewerTabs,
    subagents,
    subAgentMatches,
  }), [noop, sessionId, tabs, activeTab, activeTabId, setActiveTab, viewerTabData, viewerTabs, subagents, subAgentMatches])

  useEffect(() => {
    register(slotIndex, ctx)
    return () => register(slotIndex, null)
  }, [slotIndex, ctx, register])

  return (
    <ReplayProvider value={ctx}>
      <ReplayStageWidget />
      {subagents.map((sub, i) => {
        const match = subAgentMatches[i]
        return (
          <SubAgentStageWidget
            key={sub.agentHash}
            session={sub}
            matchKey={match?.orphan ? null : (match?.key ?? null)}
            parentSessionId={sessionId ?? ''}
          />
        )
      })}
    </ReplayProvider>
  )
}

// ── Snap feed: capture wheel to prevent inner ScrollArea from stealing it ──

function useSnapFeed() {
  const feedRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    // Capture phase: stop wheel from reaching inner ScrollArea,
    // but do NOT preventDefault — let the browser natively scroll+snap the feed
    const onWheel = (e: WheelEvent) => {
      // eslint-disable-next-line no-restricted-syntax
      e.stopPropagation()
    }
    el.addEventListener('wheel', onWheel, { capture: true })
    return () => el.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions)
  }, [])

  return feedRef
}

// ── Page ──

function useCurrentIndex(feedRef: React.RefObject<HTMLDivElement | null>) {
  const [index, setIndex] = useState(0)
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    const onScroll = () => {
      const next = Math.round(el.scrollTop / el.clientHeight)
      setIndex(prev => prev === next ? prev : next)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [feedRef])
  return index
}

export default function PageReplay() {
  const feedRef = useSnapFeed()
  const currentIndex = useCurrentIndex(feedRef)
  const [registry, setRegistry] = useState<Record<number, ReplayContextValue>>({})
  const register = useCallback<RegisterCtx>((index, ctx) => {
    setRegistry(prev => {
      if (ctx === null) {
        if (!(index in prev)) return prev
        const { [index]: _, ...rest } = prev
        return rest
      }
      if (prev[index] === ctx) return prev
      return { ...prev, [index]: ctx }
    })
  }, [])
  // Slots 0..L-1 = Live (one per active session, min 1 placeholder); L..L+N-1 = sessionEntries
  const activeSessions = useActiveSessions()
  const liveSlots: Array<{ id: string | null; active: boolean; subagentFiles: SubAgentFile[] }> =
    activeSessions.length > 0
      ? activeSessions.map(s => ({ id: s.id, active: s.active, subagentFiles: s.subagentFiles }))
      : [{ id: null, active: false, subagentFiles: [] }]
  const liveCount = liveSlots.length
  const replayIndex = currentIndex - liveCount
  const activeCtx = currentIndex < liveCount
    ? (registry[-(currentIndex + 1)] ?? null)
    : (replayIndex >= 0 ? (registry[replayIndex] ?? null) : null)
  const currentSessionId = replayIndex >= 0 ? (sessionEntries[replayIndex]?.id ?? null) : null
  const totalSlots = liveCount + sessionEntries.length

  return (
    <div className={ax({ layout: 'bar' })}>
      {/* Sidebar — fixed, always rendered (ctx may be null between slot transitions) */}
      <ReplaySidebarWidget
        ctx={activeCtx}
        sessionEntries={sessionEntries}
        currentSessionId={currentSessionId}
      />
      {/* Dot indicator — right edge */}
      <div className={`replay-dots ${ax({ layout: 'stack', placement: 'top-end' })}`}>
        {Array.from({ length: totalSlots }).map((_, i) => (
          <div key={i} className={`replay-dot ${i === currentIndex ? 'replay-dot--active' : ''}`} />
        ))}
      </div>
      <div ref={feedRef} className={`replay-feed ${ax({ layout: 'scroll' })}`}>
        {liveSlots.map((slot, i) => (
          <div key={`live-${slot.id ?? 'empty'}`} className={`replay-slot ${ax({ layout: 'scroll-x' })}`}>
            {Math.abs(i - currentIndex) <= 1
              ? <LiveSlot
                  slotIndex={-(i + 1)}
                  sessionId={slot.id}
                  parentActive={slot.active}
                  subagentFiles={slot.subagentFiles}
                  register={register}
                />
              : null}
          </div>
        ))}
        {sessionEntries.map((entry, i) => (
          <div key={entry.id} className="replay-slot">
            {Math.abs(i - replayIndex) <= 1
              ? <ReplaySlot entry={entry} index={i} register={register} />
              : null}
          </div>
        ))}
      </div>
    </div>
  )
}

// ② 2026-04-03-viewer-command-prd.md
// @useState-hatch — allMessages/messages: async replay data per slot
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { createStore } from '@os/store/createStore'
import type { NormalizedData } from '@os/store/types'
import type { ChatMessage } from '@os/ui/chat/types'
import { useAnimationQueue } from '@os/ui/useAnimationQueue'
import { ax } from '@styles/ax'
import { chatReducer, toReplayDeltas, type TimedDelta } from './replayDelta'
import { parseJsonl, extractToolSteps } from './parseJsonl'
import { createFileState, applyRead, applyEdit, applyWrite } from './fileState'
import { fetchFile } from '../viewer/fsClient'
import { editAnimationFrames, readFrames, writeFrames, type TimedFrame } from '@os/ui/editAnimation'
import { useViewerTabs } from './useViewerTabs'
import type { FileViewerHandle, ViewerTab } from '@os/ui/viewerTypes'
import { ReplayProvider, type ReplayContextValue } from './replayContext'
import { ReplayStageWidget } from './replayWidgets'

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

// ── Unified delta for replay ──

type ViewerDelta =
  | { kind: 'chat'; td: TimedDelta }
  | { kind: 'frame'; frame: TimedFrame }
  | { kind: 'terminal'; command: string; output: string }
  | { kind: 'search'; query: string; output: string }

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

function ReplaySlot({ entry }: { entry: SessionEntry }) {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [mode] = useState<'replay' | 'live'>('replay')
  const [editingLine, setEditingLine] = useState<number | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const slotRef = useRef<HTMLDivElement>(null)
  const hasStartedRef = useRef(false)

  const viewerTabs = useViewerTabs()
  const fileViewerRef = useRef<FileViewerHandle>(null)
  const activeFileRef = useRef<string | null>(null)
  const zoomActiveRef = useRef(false)

  // IntersectionObserver — detect when this slot is visible
  useEffect(() => {
    const el = slotRef.current
    if (!el) return
    const observer = new IntersectionObserver(
      ([e]) => setIsVisible(e.isIntersecting),
      { threshold: 0.5 },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  // Replay release handler
  const onRelease = useCallback((vd: ViewerDelta) => {
    if (vd.kind === 'chat') {
      setMessages(prev => chatReducer(prev, vd.td.delta))
      return
    }
    if (vd.kind === 'terminal') {
      viewerTabs.openTerminal(vd.command, vd.output)
      return
    }
    if (vd.kind === 'search') {
      viewerTabs.openSearch(vd.query, vd.output)
      return
    }
    const f = vd.frame.frame
    if (f.filePath != null) {
      viewerTabs.openFile(f.filePath, f.content ?? '')
      activeFileRef.current = f.filePath
      if (fileViewerRef.current && f.content != null) {
        fileViewerRef.current.dispatch({ type: 'open', content: f.content })
      }
    } else if (f.content != null) {
      const path = activeFileRef.current
      if (path) {
        viewerTabs.openFile(path, f.content)
        if (fileViewerRef.current) {
          fileViewerRef.current.dispatch({ type: 'update-content', content: f.content })
        }
      }
    }
    if (f.highlights !== undefined && fileViewerRef.current) {
      if (f.highlights) {
        fileViewerRef.current.dispatch({ type: 'highlight', lines: f.highlights })
        if (!zoomActiveRef.current) {
          const firstLine = Math.min(...f.highlights.keys())
          fileViewerRef.current.dispatch({ type: 'zoom', line: firstLine })
          setEditingLine(firstLine)
          zoomActiveRef.current = true
          if (activeFileRef.current) viewerTabs.markEdited(activeFileRef.current)
        }
      } else {
        fileViewerRef.current.dispatch({ type: 'clear' })
      }
    }
    if (f.cursorLine != null && zoomActiveRef.current && fileViewerRef.current) {
      fileViewerRef.current.dispatch({ type: 'zoom', line: f.cursorLine })
      setEditingLine(f.cursorLine)
    }
    if (f.cursorLine === null && zoomActiveRef.current && f.content != null) {
      fileViewerRef.current?.dispatch({ type: 'zoom-reset' })
      zoomActiveRef.current = false
      setEditingLine(null)
    }
  }, [viewerTabs])

  const getDelay = useCallback((vd: ViewerDelta) => {
    if (vd.kind === 'chat') return vd.td.delay
    if (vd.kind === 'frame') return vd.frame.delay
    return 500 // terminal/search tab switch delay
  }, [])

  const { enqueueAll, clear: clearReplay, isRunning } = useAnimationQueue<ViewerDelta>({
    onRelease,
    getDelay,
  })

  // Load session data
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

  const startReplay = useCallback(async () => {
    clearReplay()
    setMessages([])
    viewerTabs.clear()

    if (allMessages.length === 0) return

    const chatDeltas = toReplayDeltas(allMessages)
    const toolSteps = extractToolSteps(allMessages)

    const simFs = createFileState()
    const toolAnimations = new Map<number, TimedFrame[]>()

    const readPaths = new Set(toolSteps.filter(s => s.tool === 'Read' && s.filePath).map(s => s.filePath!))
    const realFiles = new Map<string, string>()
    await Promise.all([...readPaths].map(async (path) => {
      try {
        const content = await fetchFile(path)
        if (content) realFiles.set(path, content)
      } catch { /* fallback */ }
    }))

    for (const step of toolSteps) {
      if (step.tool === 'Read' && step.filePath) {
        if (step.result) {
          applyRead(simFs, step.filePath, step.result)
        } else {
          const realContent = realFiles.get(step.filePath)
          if (realContent != null) applyRead(simFs, step.filePath, realContent, true)
        }
        const content = simFs.files.get(step.filePath) ?? ''
        toolAnimations.set(step.index, readFrames(step.filePath, content))
      } else if (step.tool === 'Write' && step.filePath) {
        const content = (step.input.content as string) ?? ''
        applyWrite(simFs, step.filePath, content)
        toolAnimations.set(step.index, writeFrames(step.filePath, content))
      } else if (step.tool === 'Edit' && step.filePath) {
        const oldStr = (step.input.old_string as string) ?? ''
        const newStr = (step.input.new_string as string) ?? ''
        const preContent = simFs.files.get(step.filePath) ?? ''
        const range = applyEdit(simFs, step.filePath, oldStr, newStr)
        const oldLineRange = range ? { start: range.oldStart, end: range.oldEnd } : null
        const editFrames = editAnimationFrames(preContent, oldStr, newStr, oldLineRange)
        toolAnimations.set(step.index, [
          { frame: { filePath: step.filePath }, delay: 0 },
          ...editFrames,
        ])
      }
    }

    const unified: ViewerDelta[] = []
    let toolIdx = 0

    for (const td of chatDeltas) {
      const isToolMsg = td.delta.type === 'add-message' && td.delta.message.role === 'system'
      const chatTd = isToolMsg ? td : { ...td, delay: 0 }
      unified.push({ kind: 'chat', td: chatTd })

      if (td.delta.type === 'add-message' && td.delta.message.role === 'system') {
        const msg = td.delta.message
        for (let i = 0; i < msg.blocks.length; i++) {
          const block = msg.blocks[i]
          if (block.type !== 'tool_use' || !('data' in block)) continue
          const anim = toolAnimations.get(toolIdx)
          if (anim) {
            for (const f of anim) unified.push({ kind: 'frame', frame: f })
          }
          // Bash → terminal tab, Grep/Glob → search tab
          const step = toolSteps[toolIdx]
          if (step) {
            if (step.tool === 'Bash') {
              const cmd = (step.input.command as string) ?? ''
              unified.push({ kind: 'terminal', command: cmd, output: step.result ?? '' })
            } else if (step.tool === 'Grep' || step.tool === 'Glob') {
              const query = (step.input.pattern as string) ?? ''
              unified.push({ kind: 'search', query, output: step.result ?? '' })
            }
          }
          toolIdx++
        }
      }
    }

    enqueueAll(unified)
  }, [allMessages, enqueueAll, clearReplay, viewerTabs])

  // Auto-start replay when slot becomes visible (once)
  useEffect(() => {
    if (isVisible && allMessages.length > 0 && !hasStartedRef.current) {
      hasStartedRef.current = true
      startReplay()
    }
  }, [isVisible, allMessages, startReplay])

  const { tabs, activeTab, activeTabId, setActiveTab } = viewerTabs

  const viewerTabData: NormalizedData = useMemo(() => {
    if (tabs.length === 0) return createStore({ entities: {}, relationships: {} })
    const entities = Object.fromEntries(tabs.map(t => [t.id, { id: t.id, data: { label: tabLabel(t), type: t.type } }]))
    return createStore({ entities, relationships: { __root__: tabs.map(t => t.id) } })
  }, [tabs])

  const noop = useCallback(() => {}, [])

  const replayCtx = useMemo<ReplayContextValue>(() => ({
    selectedId: entry.id, setSelectedId: noop, sessionEntries,
    messages, isRunning, startReplay, editingLine,
    mode, setMode: noop as never,
    tabs, activeTab, activeTabId, setActiveTab, viewerTabData, fileViewerRef,
    viewerTabs,
  }), [entry.id, noop, messages, isRunning, startReplay, editingLine, mode, tabs, activeTab, activeTabId, setActiveTab, viewerTabData, viewerTabs])

  return (
    <div ref={slotRef} className="replay-slot">
      <ReplayProvider value={replayCtx}>
        <ReplayStageWidget />
      </ReplayProvider>
    </div>
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
      e.stopPropagation()
    }
    el.addEventListener('wheel', onWheel, { capture: true })
    return () => el.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions)
  }, [])

  return feedRef
}

// ── Current session indicator ──

function useCurrentSessionId(feedRef: React.RefObject<HTMLDivElement | null>) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    const onScroll = () => {
      const i = Math.round(el.scrollTop / el.clientHeight)
      setIndex(i)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [feedRef])

  return sessionEntries[index]?.id ?? ''
}

// ── Page ──

export default function PageReplay() {
  const feedRef = useSnapFeed()
  const currentId = useCurrentSessionId(feedRef)
  return (
    <div className={ax({ layout: 'fill' })} style={{ overflow: 'hidden' }}>
      {/* Session ID overlay — outside scroll */}
      <div className={ax({ placement: 'top-start', padding: 'sm' })} style={{ zIndex: 30, pointerEvents: 'none' }}>
        <span className={ax({ textStyle: 'caption', weight: 'semi', text: 'muted' })}>{currentId}</span>
      </div>
      <div ref={feedRef} className={`replay-feed ${ax({ scroll: 'y' })}`}>
        {sessionEntries.map(entry => (
          <ReplaySlot key={entry.id} entry={entry} />
        ))}
      </div>
    </div>
  )
}

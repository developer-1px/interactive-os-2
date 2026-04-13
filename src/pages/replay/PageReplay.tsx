// ② 2026-04-03-viewer-command-prd.md
// @useState-hatch — selectedId/allMessages/messages: async replay data; rightTab: two-tab toggle
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { createStore } from '@os/store/createStore'
import type { NormalizedData } from '@os/store/types'
import type { ChatMessage } from '@os/ui/chat/types'
import { useAnimationQueue } from '@os/ui/useAnimationQueue'
import { chatReducer, toReplayDeltas, type TimedDelta } from './replayDelta'
import { parseJsonl, extractToolSteps } from './parseJsonl'
import { createFileState, applyRead, applyEdit, applyWrite } from './fileState'
import { fetchFile } from '../viewer/fsClient'
import { editAnimationFrames, readFrames, writeFrames, type TimedFrame } from './editAnimation'
import { useViewerTabs } from './useViewerTabs'
import type { FileViewerHandle, ViewerTab } from './viewerTypes'
import { ReplayProvider, type ReplayContextValue } from './replayContext'
import { ReplayViewerWidget, ReplayChatWidget } from './replayWidgets'

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

// ── Layout ──

const replayWidgets = createWidgetRegistry({
  ReplayViewer: ReplayViewerWidget,
  ReplayChat: ReplayChatWidget,
})

const replayLayout = definePage({
  entities: {
    root:   { data: { type: 'split', direction: 'horizontal', sizes: [0.35, 'flex'] }, children: ['viewer', 'chat'] },
    viewer: { data: { type: 'widget', widget: 'ReplayViewer' } },
    chat:   { data: { type: 'widget', widget: 'ReplayChat' } },
  },
})

// ── Unified delta for replay ──

type ViewerDelta =
  | { kind: 'chat'; td: TimedDelta }
  | { kind: 'frame'; frame: TimedFrame }

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

// ── Page ──

export default function PageReplay() {
  const [selectedId, setSelectedId] = useState(sessionEntries[0]?.id ?? '')
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [rightTab, setRightTab] = useState<'replay' | 'live'>('live')

  const viewerTabs = useViewerTabs()
  const fileViewerRef = useRef<FileViewerHandle>(null)
  const activeFileRef = useRef<string | null>(null)

  // Replay release handler
  const onRelease = useCallback((vd: ViewerDelta) => {
    if (vd.kind === 'chat') {
      setMessages(prev => chatReducer(prev, vd.td.delta))
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
          fileViewerRef.current.dispatch({ type: 'open', content: f.content })
        }
      }
    }
    if (f.highlights !== undefined) {
      if (fileViewerRef.current) {
        if (f.highlights) {
          fileViewerRef.current.dispatch({ type: 'highlight', lines: f.highlights })
        } else {
          fileViewerRef.current.dispatch({ type: 'clear' })
        }
      }
    }
  }, [viewerTabs])

  const getDelay = useCallback((vd: ViewerDelta) => {
    return vd.kind === 'chat' ? vd.td.delay : vd.frame.delay
  }, [])

  const { enqueueAll, clear: clearReplay, isRunning } = useAnimationQueue<ViewerDelta>({
    onRelease,
    getDelay,
  })

  // Load session
  useEffect(() => {
    let cancelled = false
    async function load() {
      const entry = sessionEntries.find(e => e.id === selectedId)
      if (!entry) return
      if (entry.type === 'json') {
        const path = `./sessions/${selectedId}.json`
        const loader = jsonLoaders[path]
        if (!loader) return
        const session = await loader()
        if (!cancelled) setAllMessages(session.messages)
      } else {
        const path = `./sessions/${selectedId}.jsonl`
        const loader = jsonlLoaders[path]
        if (!loader) return
        const raw = await loader()
        if (!cancelled) setAllMessages(parseJsonl(raw).messages)
      }
    }
    if (selectedId) load()
    return () => { cancelled = true }
  }, [selectedId])

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
          toolIdx++
        }
      }
    }

    enqueueAll(unified)
  }, [allMessages, enqueueAll, clearReplay, viewerTabs])

  // Auto-start replay
  const startRef = useRef(startReplay)
  useEffect(() => { startRef.current = startReplay })
  useEffect(() => {
    if (allMessages.length > 0 && rightTab === 'replay') startRef.current()
  }, [allMessages, rightTab])

  const { tabs, activeTab, activeTabId, setActiveTab } = viewerTabs

  const viewerTabData: NormalizedData = useMemo(() => {
    if (tabs.length === 0) return createStore({ entities: {}, relationships: {} })
    const entities = Object.fromEntries(tabs.map(t => [t.id, { id: t.id, data: { label: tabLabel(t), type: t.type } }]))
    return createStore({ entities, relationships: { __root__: tabs.map(t => t.id) } })
  }, [tabs])

  const rightTabData: NormalizedData = useMemo(() => createStore({
    entities: {
      live: { id: 'live', data: { label: 'Live' } },
      replay: { id: 'replay', data: { label: 'Replay' } },
    },
    relationships: { __root__: ['live', 'replay'] },
  }), [])

  const handleRightTabActivate = useCallback((nodeId: string) => {
    const tab = nodeId as 'live' | 'replay'
    setRightTab(tab)
    if (tab === 'live') {
      clearReplay()
      setMessages([])
      viewerTabs.clear()
    }
  }, [clearReplay, viewerTabs])

  // ── Context ──

  const replayCtx = useMemo<ReplayContextValue>(() => ({
    selectedId, setSelectedId, sessionEntries,
    messages, isRunning, startReplay,
    rightTab, rightTabData, handleRightTabActivate,
    tabs, activeTab, activeTabId, setActiveTab, viewerTabData, fileViewerRef,
    viewerTabs,
  }), [selectedId, sessionEntries, messages, isRunning, startReplay, rightTab, rightTabData, handleRightTabActivate, tabs, activeTab, activeTabId, setActiveTab, viewerTabData, viewerTabs])

  return (
    <ReplayProvider value={replayCtx}>
      <FlatLayout data={replayLayout} registry={replayWidgets} aria-label="Replay" />
    </ReplayProvider>
  )
}

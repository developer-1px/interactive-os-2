// ② 2026-04-03-viewer-command-prd.md
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ChatFeed } from '@os/ui/chat/ChatFeed'
import { TabList } from '@os/ui/TabList'
import { createStore } from '@os/store/createStore'
import type { NormalizedData } from '@os/store/types'
import type { NodeState } from '@os/pattern/types'
import { SplitPane } from '@os/ui/SplitPane'
import type { PaneSize } from '@os/ui/SplitPane'
import { FileViewer } from '@os/ui/FileViewer'
import { SearchResults } from '@os/ui/SearchResults'
import { TerminalOutput } from '@os/ui/TerminalOutput'
import type { ChatMessage } from '@os/ui/chat/types'
import { useAnimationQueue } from '@os/ui/useAnimationQueue'
import { ax } from '@styles/ax'
import { chatReducer, toReplayDeltas, type TimedDelta } from './replayDelta'
import { parseJsonl, extractToolSteps } from './parseJsonl'
import { createFileState, applyRead, applyEdit, applyWrite } from './fileState'
import { fetchFile } from '../viewer/fsClient'
import { editAnimationFrames, readFrames, writeFrames, type TimedFrame } from './editAnimation'
import { LiveSessionPanel } from './LiveSessionPanel'
import { chatRenderers } from './replayRenderers'
import { useViewerTabs } from './useViewerTabs'
import type { FileViewerHandle, ViewerTab } from './viewerTypes'
import { Search, Terminal, FileText } from 'lucide-react'

// --- Session loading ---

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

function filenameFrom(path: string | null): string {
  if (!path) return 'output'
  const parts = path.split('/')
  return parts[parts.length - 1] || 'output'
}

function tabLabel(tab: ViewerTab): string {
  switch (tab.type) {
    case 'file': return filenameFrom(tab.path)
    case 'search': return 'Search'
    case 'terminal': return 'Terminal'
  }
}

const tabIcons: Record<string, typeof FileText> = {
  file: FileText,
  search: Search,
  terminal: Terminal,
}

// --- Unified delta for replay ---

type ViewerDelta =
  | { kind: 'chat'; td: TimedDelta }
  | { kind: 'frame'; frame: TimedFrame }

// --- Component ---

export default function PageReplay() {
  const [selectedId, setSelectedId] = useState(sessionEntries[0]?.id ?? '')
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [sizes, setSizes] = useState<PaneSize[]>([0.7, 0.3])
  const [rightTab, setRightTab] = useState<'replay' | 'live'>('live')

  // Viewer tabs (shared between replay and live)
  const viewerTabs = useViewerTabs()
  const fileViewerRef = useRef<FileViewerHandle>(null)

  // Track active file path for replay frame dispatch
  const activeFileRef = useRef<string | null>(null)

  // Replay: release handler
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
      // Content update for current active file
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
      } catch { /* fallback to JSONL */ }
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

    // Interleave chat deltas + tool animation frames
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

  const renderViewerTab = useCallback((_props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, _state: NodeState) => {
    const d = item.data as Record<string, unknown>
    const label = d?.label as string ?? item.id as string
    const type = d?.type as string
    const Icon = tabIcons[type] ?? FileText
    return (
      <span className={ax({ layout: 'row', gap: 'xs' })}>
        <Icon size={12} /> {label}
      </span>
    )
  }, [])

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
  }, [clearReplay, setMessages, viewerTabs])

  return (
    <div className={ax({ layout: 'fill' })}>
      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes}>
        {/* Left: Viewer with tabs */}
        <div className={`${ax({ layout: 'fill' })} min-h-0`}>
          {/* Tab bar */}
          {tabs.length > 0 ? (
            <TabList
              data={viewerTabData}
              initialFocus={activeTabId ?? undefined}
              onActivate={(nodeId) => setActiveTab(nodeId)}
              renderItem={renderViewerTab}
              aria-label="Viewer tabs"
            />
          ) : (
            <div className={ax({ layout: 'bar', gap: 'xs', padding: 'xs', flex: 'none' })}>
              <span className={ax({ textStyle: 'caption', text: 'muted' })}>Viewer</span>
            </div>
          )}

          {/* Content */}
          <div className={`${ax({ flex: '1', layout: 'scroll' })} min-h-0`}>
            {activeTab?.type === 'file' ? (
              <FileViewer ref={fileViewerRef} filename={filenameFrom(activeTab.path)} />
            ) : activeTab?.type === 'search' ? (
              <SearchResults query={activeTab.query} output={activeTab.output} />
            ) : activeTab?.type === 'terminal' ? (
              <TerminalOutput command={activeTab.command} output={activeTab.output} />
            ) : (
              <div className={ax({ layout: 'center', flex: '1', text: 'muted', textStyle: 'caption' })}>
                tool_use 스텝이 재생되면 여기에 표시됩니다
              </div>
            )}
          </div>
        </div>

        {/* Right: Chat tabs (Replay / Live) */}
        <div className={ax({ layout: 'fill' })}>
          <TabList
            data={rightTabData}
            initialFocus={rightTab}
            onActivate={handleRightTabActivate}
            aria-label="Chat mode"
          />

          {rightTab === 'replay' && (
            <div className={ax({ layout: 'fill' })}>
              <div className={ax({ layout: 'bar', gap: 'sm', padding: 'xs', flex: 'none' })}>
                <select
                  value={selectedId}
                  onChange={e => setSelectedId(e.target.value)}
                  className={ax({ textStyle: 'caption' })}
                >
                  {sessionEntries.map(entry => (
                    <option key={entry.id} value={entry.id}>
                      {entry.id} ({entry.type})
                    </option>
                  ))}
                </select>
                {!isRunning && messages.length > 0 && (
                  <button onClick={startReplay} className={ax({ surface: 'ghost', controlSize: 'sm', padding: 'sm', content: 'text', textStyle: 'caption' })}>
                    Replay
                  </button>
                )}
              </div>
              <ChatFeed
                messages={messages}
                blockRenderers={chatRenderers}
                isStreaming={isRunning}
                className={ax({ flex: '1' })}
              />
            </div>
          )}

          {rightTab === 'live' && (
            <LiveSessionPanel viewerTabs={viewerTabs} fileViewerRef={fileViewerRef} />
          )}
        </div>
      </SplitPane>
    </div>
  )
}

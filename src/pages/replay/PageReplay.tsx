// ② 2026-04-03-replay-edit-animation-prd.md
import { useState, useEffect, useCallback, useRef } from 'react'
import { ChatFeed } from '@os/ui/chat/ChatFeed'
import { SplitPane } from '@os/ui/SplitPane'
import type { PaneSize } from '@os/ui/SplitPane'
import type { HighlightTone } from '@os/ui/CodeBlock'
import { FilePreview } from '@os/ui/FilePreview'
import type { ChatMessage } from '@os/ui/chat/types'
import { useAnimationQueue } from '@os/ui/useAnimationQueue'
import { ax } from '@styles/ax'
import { chatReducer, toReplayDeltas, type TimedDelta } from './replayDelta'
import { parseJsonl, extractToolSteps } from './parseJsonl'
import { createFileState, applyRead, applyEdit, applyWrite } from './fileState'
import { fetchFile } from '../viewer/fsClient'
import { editAnimationFrames, readFrames, writeFrames, type TimedFrame } from './editAnimation'
import { ReplayCursor } from './ReplayCursor'
import { LiveSessionPanel } from './LiveSessionPanel'
import { chatRenderers } from './replayRenderers'

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

// --- Unified delta ---

type ViewerDelta =
  | { kind: 'chat'; td: TimedDelta }
  | { kind: 'frame'; frame: TimedFrame }

// --- Component ---

export default function PageReplay() {
  const [selectedId, setSelectedId] = useState(sessionEntries[0]?.id ?? '')
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])

  // Viewer state
  const [openFiles, setOpenFiles] = useState<Map<string, string>>(new Map()) // path → content
  const [activeFile, setActiveFile] = useState<string | null>(null)
  const [highlights, setHighlights] = useState<Map<number, HighlightTone> | undefined>(undefined)
  const [cursorLine, setCursorLine] = useState<number | null>(null)
  const [sizes, setSizes] = useState<PaneSize[]>([0.7, 0.3])

  // Right panel tab
  const [rightTab, setRightTab] = useState<'replay' | 'live'>('live')

  // Active file ref for content updates (avoids stale closure in onRelease)
  const activeFileRef = useRef<string | null>(null)

  // Release handler
  const onRelease = useCallback((vd: ViewerDelta) => {
    if (vd.kind === 'chat') {
      setMessages(prev => chatReducer(prev, vd.td.delta))
      return
    }
    const f = vd.frame.frame
    if (f.filePath != null) {
      setOpenFiles(prev => {
        const next = new Map(prev)
        next.set(f.filePath!, f.content ?? prev.get(f.filePath!) ?? '')
        return next
      })
      setActiveFile(f.filePath)
      activeFileRef.current = f.filePath
    } else if (f.content != null) {
      const path = activeFileRef.current
      if (path) {
        setOpenFiles(prev => {
          const next = new Map(prev)
          next.set(path, f.content!)
          return next
        })
      }
    }
    if (f.highlights !== undefined) {
      setHighlights(f.highlights ?? undefined)
    }
    if (f.cursorLine !== undefined) {
      setCursorLine(f.cursorLine)
    }
  }, [])

  const getDelay = useCallback((vd: ViewerDelta) => {
    return vd.kind === 'chat' ? vd.td.delay : vd.frame.delay
  }, [])

  const { enqueueAll, clear, isRunning } = useAnimationQueue<ViewerDelta>({
    onRelease,
    getDelay,
  })

  // Live session viewer update
  const onViewerUpdate = useCallback((files: Map<string, string>, activeFilePath: string | null) => {
    setOpenFiles(files)
    setActiveFile(activeFilePath)
    activeFileRef.current = activeFilePath
    setHighlights(undefined)
    setCursorLine(null)
  }, [])

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
    clear()
    setMessages([])
    setOpenFiles(new Map())
    setActiveFile(null)
    setHighlights(undefined)
    setCursorLine(null)

    if (allMessages.length === 0) return

    const chatDeltas = toReplayDeltas(allMessages)
    const toolSteps = extractToolSteps(allMessages)

    // Pre-simulate: try fetching real files, fallback to JSONL content
    const simFs = createFileState()
    const toolAnimations = new Map<number, TimedFrame[]>()

    // Batch-fetch unique file paths from Read steps
    const readPaths = new Set(toolSteps.filter(s => s.tool === 'Read' && s.filePath).map(s => s.filePath!))
    const realFiles = new Map<string, string>()
    await Promise.all([...readPaths].map(async (path) => {
      try {
        const content = await fetchFile(path)
        if (content) realFiles.set(path, content)
      } catch { /* file doesn't exist or server unavailable — fallback to JSONL */ }
    }))

    for (const step of toolSteps) {
      if (step.tool === 'Read' && step.filePath) {
        // Prefer real file (raw), fallback to JSONL tool_result (cat -n format)
        const realContent = realFiles.get(step.filePath)
        if (realContent != null) {
          applyRead(simFs, step.filePath, realContent, true)
        } else if (step.result) {
          applyRead(simFs, step.filePath, step.result)
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
      // Non-tool messages: instant (delay 0). Tool messages keep original delay.
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
            for (const f of anim) {
              unified.push({ kind: 'frame', frame: f })
            }
          }
          toolIdx++
        }
      }
    }

    enqueueAll(unified)
  }, [allMessages, enqueueAll, clear])

  // Auto-start only when replay tab is active
  const startRef = useRef(startReplay)
  useEffect(() => { startRef.current = startReplay })
  useEffect(() => {
    if (allMessages.length > 0 && rightTab === 'replay') startRef.current()
  }, [allMessages, rightTab])

  // Current file content
  const currentCode = activeFile ? openFiles.get(activeFile) ?? null : null
  const tabs = [...openFiles.keys()]
  const codeContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to highlighted/cursor line
  const scrollTargetLine = cursorLine ?? (highlights ? Math.min(...highlights.keys()) : null)
  useEffect(() => {
    if (scrollTargetLine == null || !codeContainerRef.current) return
    const lineEl = codeContainerRef.current.querySelector(`[data-line="${scrollTargetLine}"]`)
    if (lineEl) {
      lineEl.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }
  }, [scrollTargetLine])

  return (
    <div className={ax({ layout: 'fill' })}>
      <SplitPane direction="horizontal" sizes={sizes} onResize={setSizes}>
        {/* Left: Code Viewer with tabs */}
        <div className={`${ax({ layout: 'fill' })} min-h-0`}>
          {/* Tab bar */}
          <div className={ax({ layout: 'bar', gap: 'xs', padding: 'xs', flex: 'none' })} role="tablist">
            {tabs.map(path => (
              <button
                key={path}
                role="tab"
                aria-selected={path === activeFile}
                onClick={() => setActiveFile(path)}
                className={ax({
                  surface: path === activeFile ? 'display' : 'ghost',
                  controlSize: 'sm',
                  textStyle: 'caption',
                  tone: path === activeFile ? 'accent' : undefined,
                })}
              >
                {filenameFrom(path)}
              </button>
            ))}
            {tabs.length === 0 && (
              <span className={ax({ textStyle: 'caption', text: 'muted' })}>Code Viewer</span>
            )}
          </div>

          {/* Code content */}
          <div ref={codeContainerRef} className={`${ax({ flex: '1', layout: 'scroll' })} min-h-0`} style={{ position: 'relative' }}>
            {currentCode != null ? (
              <>
                <FilePreview
                  content={currentCode}
                  filename={filenameFrom(activeFile)}
                  highlightLines={highlights}
                />
                {cursorLine != null && <ReplayCursor line={cursorLine} />}
              </>
            ) : (
              <div className={ax({ layout: 'center', flex: '1', text: 'muted', textStyle: 'caption' })}>
                tool_use 스텝이 재생되면 여기에 표시됩니다
              </div>
            )}
          </div>
        </div>

        {/* Right: Chat tabs (Replay / Live) */}
        <div className={ax({ layout: 'fill' })}>
          {/* Tab bar */}
          <div className={ax({ layout: 'bar', gap: 'xs', padding: 'xs', flex: 'none' })} role="tablist">
            <button
              role="tab"
              aria-selected={rightTab === 'live'}
              onClick={() => {
                setRightTab('live')
                // Stop replay + clear viewer
                clear()
                setMessages([])
                setOpenFiles(new Map())
                setActiveFile(null)
                activeFileRef.current = null
                setHighlights(undefined)
                setCursorLine(null)
              }}
              className={ax({ surface: rightTab === 'live' ? 'display' : 'ghost', controlSize: 'sm', textStyle: 'caption', tone: rightTab === 'live' ? 'accent' : undefined })}
            >
              Live
            </button>
            <button
              role="tab"
              aria-selected={rightTab === 'replay'}
              onClick={() => setRightTab('replay')}
              className={ax({ surface: rightTab === 'replay' ? 'display' : 'ghost', controlSize: 'sm', textStyle: 'caption', tone: rightTab === 'replay' ? 'accent' : undefined })}
            >
              Replay
            </button>
          </div>

          {/* Replay tab */}
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
                  <button onClick={startReplay} className={ax({ surface: 'ghost', controlSize: 'sm', textStyle: 'caption' })}>
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

          {/* Live tab */}
          {rightTab === 'live' && (
            <LiveSessionPanel onViewerUpdate={onViewerUpdate} />
          )}
        </div>
      </SplitPane>
    </div>
  )
}

// Kanban card → Replay shorts overlay
// @useState-hatch — allMessages/messages: async timeline replay data
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { ax } from '@styles/ax'
import { Button } from '@os/ui/Button'
import { PanelHeader } from '@os/ui/PanelHeader'
import { CloseIndicator } from '@os/ui/indicators'
import { useOverlay } from '@os/overlay/useOverlay'
import { useAnimationQueue } from '@os/ui/useAnimationQueue'
import { createStore } from '@os/store/createStore'
import type { NormalizedData } from '@os/store/types'
import type { ChatMessage } from '@os/ui/chat/types'
import type { FileViewerHandle } from '@os/ui/viewerTypes'
import type { TimelineEvent } from '../viewer/groupEvents'
import { timelineToMessages } from '../viewer/timelineTransform'
import { chatReducer, toReplayDeltas } from './replayDelta'
import type { TimedDelta } from './replayDelta'
import { extractToolSteps } from './parseJsonl'
import { createFileState, applyRead, applyEdit, applyWrite } from './fileState'
import { fetchFile } from '../viewer/fsClient'
import { editAnimationFrames, readFrames, writeFrames, type TimedFrame } from '@os/ui/editAnimation'
import { useViewerTabs } from './useViewerTabs'
import { ReplayProvider, type ReplayContextValue } from './replayContext'
import { ReplayStageWidget } from './replayWidgets'
import type { SessionCard } from './sessionCardExtractor'

// ── Unified delta (same as PageReplay) ──

type ViewerDelta =
  | { kind: 'chat'; td: TimedDelta }
  | { kind: 'frame'; frame: TimedFrame }
  | { kind: 'terminal'; command: string; output: string }
  | { kind: 'search'; query: string; output: string }

// ── Replay slot for a single session card ──

function SessionReplaySlot({ sessionId }: { sessionId: string }) {
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [editingLine, setEditingLine] = useState<number | null>(null)
  const hasStartedRef = useRef(false)

  const viewerTabs = useViewerTabs()
  const fileViewerRef = useRef<FileViewerHandle>(null)
  const activeFileRef = useRef<string | null>(null)

  // Load timeline from API
  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const res = await fetch(`/api/agent-ops/timeline?session=${sessionId}&tail=2000`)
        if (!res.ok) return
        const { events } = await res.json() as { events: TimelineEvent[] }
        if (!cancelled) setAllMessages(timelineToMessages(events))
      } catch { /* ignore */ }
    }
    load()
    return () => { cancelled = true }
  }, [sessionId])

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
    // Highlights & cursor drive Camera directly via FileViewer dispatch.
    // No flag state-machine — current input conditions fully determine the intent.
    if (f.highlights !== undefined && fileViewerRef.current) {
      if (f.highlights) {
        fileViewerRef.current.dispatch({ type: 'highlight', lines: f.highlights })
        const firstLine = Math.min(...f.highlights.keys())
        fileViewerRef.current.dispatch({ type: 'zoom', line: firstLine })
        setEditingLine(firstLine)
        if (activeFileRef.current) viewerTabs.markEdited(activeFileRef.current)
      } else {
        fileViewerRef.current.dispatch({ type: 'clear' })
      }
    }
    if (f.cursorLine != null && fileViewerRef.current) {
      fileViewerRef.current.dispatch({ type: 'zoom', line: f.cursorLine })
      setEditingLine(f.cursorLine)
    }
    if (f.cursorLine === null && f.content != null) {
      fileViewerRef.current?.dispatch({ type: 'zoom-reset' })
      setEditingLine(null)
    }
  }, [viewerTabs])

  const getDelay = useCallback((vd: ViewerDelta) => {
    if (vd.kind === 'chat') return vd.td.delay
    if (vd.kind === 'frame') return vd.frame.delay
    return 500
  }, [])

  const { enqueueAll, clear: clearReplay, isRunning } = useAnimationQueue<ViewerDelta>({
    onRelease,
    getDelay,
  })

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

  // Auto-start on load
  useEffect(() => {
    if (allMessages.length > 0 && !hasStartedRef.current) {
      hasStartedRef.current = true
      startReplay()
    }
  }, [allMessages, startReplay])

  const { tabs, activeTab, activeTabId, setActiveTab } = viewerTabs
  const noop = useCallback(() => {}, [])

  const viewerTabData: NormalizedData = useMemo(() => {
    if (tabs.length === 0) return createStore({ entities: {}, relationships: {} })
    const entities = Object.fromEntries(tabs.map(t => {
      const label = t.type === 'file' ? (t.path ?? 'output').split('/').pop()! : t.type === 'search' ? 'Search' : 'Terminal'
      return [t.id, { id: t.id, data: { label, type: t.type } }]
    }))
    return createStore({ entities, relationships: { __root__: tabs.map(t => t.id) } })
  }, [tabs])

  const replayCtx = useMemo<ReplayContextValue>(() => ({
    selectedId: sessionId, setSelectedId: noop, sessionEntries: [],
    messages, allMessagesCount: allMessages.length, isRunning, startReplay, editingLine,
    mode: 'replay' as const, setMode: noop as never,
    tabs, activeTab, activeTabId, setActiveTab, viewerTabData, fileViewerRef,
    viewerTabs,
  }), [sessionId, noop, messages, allMessages.length, isRunning, startReplay, editingLine, tabs, activeTab, activeTabId, setActiveTab, viewerTabData, viewerTabs])

  return (
    <ReplayProvider value={replayCtx}>
      <ReplayStageWidget />
    </ReplayProvider>
  )
}

// ── Modal ──

export function SessionDetailModal({ card, onClose }: { card: SessionCard | null; onClose: () => void }) {
  const { isOpen, open, close, contentRef } = useOverlay({ type: 'modal' })

  useEffect(() => {
    if (card && !isOpen) open()
    if (!card && isOpen) close()
  }, [!!card]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen && card) onClose()
  }, [isOpen]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <dialog
      ref={contentRef as React.RefObject<HTMLDialogElement>}
      className={`kanban-detail-dialog ${ax({ surface: 'overlay', width: 'full', layout: 'stack' })}`}
      aria-label="Session replay"
    >
      <PanelHeader axes={{ layout: 'spread' }}>
        {card && (
          <div className={ax({ layout: 'bar', textStyle: 'caption' })}>
            <span className={ax({ })}>{card.label}</span>
            <span>{card.allMessages.length} messages</span>
            <span>{card.toolCount} tools</span>
            {card.lastSkill && <span>/{card.lastSkill}</span>}
          </div>
        )}
        <Button icon onClick={close}>
          <CloseIndicator />
        </Button>
      </PanelHeader>
      <div className={ax({ flex: '1', layout: 'fill' })}>
        {card && <SessionReplaySlot sessionId={card.id} />}
      </div>
    </dialog>
  )
}

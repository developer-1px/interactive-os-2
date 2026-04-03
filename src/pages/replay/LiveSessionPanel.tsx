import { useState, useEffect, useMemo, useRef } from 'react'
import { connectSession, disconnectSession, useTimeline, useSessionMeta } from '../viewer/viewerStore'
import { timelineToMessages } from '../viewer/timelineAdapter'
import { ChatFeed } from '@os/ui/chat/ChatFeed'
import type { HighlightTone } from '@os/ui/CodeBlock'
import { ax } from '@styles/ax'
import { useActiveSessions } from './useActiveSessions'
import { createFileState, applyRead, applyEdit, applyWrite } from './fileState'
import { fetchFile } from '../viewer/fsClient'
import { chatRenderers } from './replayRenderers'
import type { ViewerOverlay } from './PageReplay'

interface LiveSessionPanelProps {
  onViewerUpdate: (
    files: Map<string, string>,
    activeFile: string | null,
    highlights?: Map<number, HighlightTone>,
    overlay?: ViewerOverlay,
  ) => void
}

export function LiveSessionPanel({ onViewerUpdate }: LiveSessionPanelProps) {
  const activeSessions = useActiveSessions()
  const [userSelectedId, setUserSelectedId] = useState<string | null>(null)

  const selectedId = activeSessions.length === 0
    ? null
    : (userSelectedId && activeSessions.find(s => s.id === userSelectedId))
      ? userSelectedId
      : activeSessions[0].id

  return (
    <div className={ax({ layout: 'fill' })}>
      <div className={ax({ layout: 'bar', gap: 'xs', padding: 'xs', flex: 'none' })} role="tablist">
        {activeSessions.map(s => (
          <button
            key={s.id}
            role="tab"
            aria-selected={s.id === selectedId}
            onClick={() => setUserSelectedId(s.id)}
            className={ax({
              surface: s.id === selectedId ? 'display' : 'ghost',
              controlSize: 'sm',
              textStyle: 'caption',
              tone: s.id === selectedId ? 'accent' : undefined,
            })}
          >
            {s.label}
          </button>
        ))}
        {activeSessions.length === 0 && (
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>활성 세션 없음</span>
        )}
      </div>

      {selectedId && (
        <LiveFeed
          key={selectedId}
          sessionId={selectedId}
          onViewerUpdate={onViewerUpdate}
        />
      )}
    </div>
  )
}

function LiveFeed({ sessionId, onViewerUpdate }: { sessionId: string; onViewerUpdate: LiveSessionPanelProps['onViewerUpdate'] }) {
  useEffect(() => {
    connectSession(sessionId, true)
    return () => disconnectSession(sessionId)
  }, [sessionId])

  const timeline = useTimeline(sessionId)
  const { agentStatus, fetchError, initialLoading } = useSessionMeta(sessionId)
  const messages = useMemo(() => timelineToMessages(timeline), [timeline])

  // Incremental file state tracking
  const processedRef = useRef(0)
  const fsRef = useRef(createFileState())
  const fetchedRef = useRef(new Set<string>())

  useEffect(() => {
    if (timeline.length === 0 || timeline.length <= processedRef.current) return
    let aborted = false

    const newEvents = timeline.slice(processedRef.current)
    processedRef.current = timeline.length

    let lastFilePath: string | null = null
    let lastHighlights: Map<number, HighlightTone> | undefined
    let lastOverlay: ViewerOverlay = null
    const toFetch = new Set<string>()

    for (let i = 0; i < newEvents.length; i++) {
      const evt = newEvents[i]
      if (evt.type !== 'tool_use') continue

      // File tools → clear overlay, update file state
      if (evt.filePath && (evt.tool === 'Read' || evt.tool === 'Edit' || evt.tool === 'Write')) {
        lastFilePath = evt.filePath
        lastHighlights = undefined
        lastOverlay = null

        if (evt.tool === 'Read') {
          if (!fetchedRef.current.has(evt.filePath) && !fsRef.current.files.has(evt.filePath)) {
            toFetch.add(evt.filePath)
          }
        } else if (evt.tool === 'Write' && evt.editNew) {
          applyWrite(fsRef.current, evt.filePath, evt.editNew)
        } else if (evt.tool === 'Edit' && evt.editOld && evt.editNew) {
          const range = applyEdit(fsRef.current, evt.filePath, evt.editOld, evt.editNew)
          if (range) {
            const hl = new Map<number, HighlightTone>()
            for (let line = range.newStart; line <= range.newEnd; line++) {
              hl.set(line, 'edited')
            }
            lastHighlights = hl
          }
        }
        continue
      }

      // Grep/Glob → search overlay
      if (evt.tool === 'Grep' || evt.tool === 'Glob') {
        const result = findNextResult(newEvents, i)
        lastOverlay = { type: 'search', query: evt.text ?? '', output: result }
        continue
      }

      // Bash → terminal overlay
      if (evt.tool === 'Bash') {
        const result = findNextResult(newEvents, i)
        lastOverlay = { type: 'terminal', command: evt.text ?? '', output: result }
        continue
      }
    }

    function flush() {
      if (aborted) return
      onViewerUpdate(new Map(fsRef.current.files), lastFilePath, lastHighlights, lastOverlay)
    }

    if (toFetch.size > 0) {
      Promise.all([...toFetch].map(async (p) => {
        try {
          const content = await fetchFile(p)
          if (content) {
            applyRead(fsRef.current, p, content, true)
            fetchedRef.current.add(p)
          }
        } catch { /* unavailable */ }
      })).then(flush)
    } else if (lastFilePath || lastOverlay) {
      flush()
    }

    return () => { aborted = true }
  }, [timeline, onViewerUpdate])

  return (
    <>
      {fetchError ? (
        <div className={ax({ layout: 'center', flex: '1', text: 'muted', textStyle: 'caption' })}>
          Failed to load: {fetchError}
        </div>
      ) : initialLoading ? (
        <div className={ax({ layout: 'center', flex: '1', text: 'muted', textStyle: 'caption' })}>
          Loading...
        </div>
      ) : messages.length === 0 ? (
        <div className={ax({ layout: 'center', flex: '1', text: 'muted', textStyle: 'caption' })}>
          에이전트 활동 대기중...
        </div>
      ) : (
        <ChatFeed
          messages={messages}
          blockRenderers={chatRenderers}
          isStreaming={agentStatus === 'running'}
          streamingLabel="Thinking"
          className={ax({ flex: '1' })}
        />
      )}
    </>
  )
}

/** Find the next tool_result text after a tool_use at index i. */
function findNextResult(events: { type: string; text?: string }[], i: number): string {
  for (let j = i + 1; j < events.length; j++) {
    if (events[j].type === 'tool_result') return events[j].text ?? ''
    if (events[j].type === 'tool_use') break // next tool started, no result found
  }
  return ''
}

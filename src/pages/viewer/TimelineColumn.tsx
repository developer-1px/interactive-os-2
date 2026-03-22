import styles from './TimelineColumn.module.css'
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import {
  Circle, User, Bot, FileText, Terminal,
  Pencil, Search, FilePlus,
} from 'lucide-react'
import { DEFAULT_ROOT } from './types'

// --- Types ---

export interface TimelineEvent {
  type: 'user' | 'assistant' | 'tool_use' | 'tool_result'
  ts: string
  tool?: string
  filePath?: string
  text?: string
  editOld?: string
  editNew?: string
}

interface TimelineColumnProps {
  sessionId: string
  sessionLabel: string
  isLive: boolean
  isArchive?: boolean
  onClose?: () => void
  onFileClick: (filePath: string, editRanges?: string[]) => void
}

// --- Helpers ---

function relPath(absPath: string): string {
  return absPath.replace(DEFAULT_ROOT + '/', '')
}

function eventLabel(evt: TimelineEvent): string {
  if (evt.type === 'user') return evt.text ?? ''
  if (evt.type === 'assistant') return evt.text ?? ''
  if (evt.tool === 'Read' && evt.filePath) return `Read ${relPath(evt.filePath)}`
  if (evt.tool === 'Edit' && evt.filePath) return `Edit ${relPath(evt.filePath)}`
  if (evt.tool === 'Write' && evt.filePath) return `Write ${relPath(evt.filePath)}`
  if (evt.tool === 'Bash') return `$ ${evt.text ?? ''}`
  if (evt.tool === 'Grep') return `grep "${evt.text ?? ''}"`
  if (evt.tool === 'Glob') return `glob "${evt.text ?? ''}"`
  return evt.tool ?? evt.type
}

function isNearBottom(el: HTMLElement, threshold = 100): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight < threshold
}

// --- Event icon ---

function EventIcon({ evt }: { evt: TimelineEvent }) {
  if (evt.type === 'user') return <User size={11} />
  if (evt.type === 'assistant') return <Bot size={11} />
  if (evt.tool === 'Read') return <FileText size={11} />
  if (evt.tool === 'Edit') return <Pencil size={11} />
  if (evt.tool === 'Write') return <FilePlus size={11} />
  if (evt.tool === 'Bash') return <Terminal size={11} />
  if (evt.tool === 'Grep' || evt.tool === 'Glob') return <Search size={11} />
  return <Circle size={11} />
}

// --- Timeline item (memoized) ---

const TimelineItem = memo(function TimelineItem({ evt, onClick }: { evt: TimelineEvent; onClick: (evt: TimelineEvent) => void }) {
  const typeClass = evt.type === 'tool_use'
    ? styles[`tc${evt.tool ?? ''}`] ?? ''
    : evt.type === 'user'
      ? styles.tcUser
      : evt.type === 'assistant'
        ? styles.tcAssistant
        : ''
  const cls = `${styles.tcItem} ${typeClass}`
  return (
    <div
      className={cls}
      onClick={() => onClick(evt)}
      style={evt.filePath ? { cursor: 'pointer' } : undefined}
    >
      <span className={styles.tcIcon}>
        <EventIcon evt={evt} />
      </span>
      <span className={styles.tcText}>
        {eventLabel(evt)}
      </span>
    </div>
  )
})

// --- Component ---

export function TimelineColumn({ sessionId, sessionLabel, isLive, isArchive, onClose, onFileClick }: TimelineColumnProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const lastUserRef = useRef<HTMLDivElement>(null)

  // Track editRanges per file for onFileClick
  const editRangesRef = useRef<Map<string, string[]>>(new Map())

  // Accumulate editRanges from events
  const trackEditRanges = useCallback((events: TimelineEvent[]) => {
    for (const evt of events) {
      if (evt.type !== 'tool_use') continue
      if ((evt.tool === 'Edit' || evt.tool === 'Write') && evt.filePath && evt.editNew) {
        const existing = editRangesRef.current.get(evt.filePath)
        if (existing) {
          existing.push(evt.editNew)
        } else {
          editRangesRef.current.set(evt.filePath, [evt.editNew])
        }
      }
    }
  }, [])

  // --- Initial timeline fetch ---
  useEffect(() => {
    fetch(`/api/agent-ops/timeline?session=${encodeURIComponent(sessionId)}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((events: TimelineEvent[]) => {
        editRangesRef.current = new Map()
        trackEditRanges(events)
        setTimeline(events)
        setFetchError(null)
      })
      .catch(e => setFetchError(e.message))
  }, [sessionId, trackEditRanges])

  // --- SSE connection (live sessions only) ---
  useEffect(() => {
    if (!isLive) return
    const es = new EventSource(`/api/agent-ops/timeline-stream?session=${encodeURIComponent(sessionId)}`)

    let pendingEvents: TimelineEvent[] = []
    let rafId = 0

    function flushPending() {
      rafId = 0
      if (pendingEvents.length === 0) return
      const batch = pendingEvents
      pendingEvents = []
      trackEditRanges(batch)
      setTimeline(prev => [...prev, ...batch])
    }

    es.onmessage = (event) => {
      let evt: TimelineEvent
      try { evt = JSON.parse(event.data) } catch { return }
      pendingEvents.push(evt)
      if (!rafId) rafId = requestAnimationFrame(flushPending)
    }

    es.onerror = () => {
      es.addEventListener('open', function refetch() {
        es.removeEventListener('open', refetch)
        fetch(`/api/agent-ops/timeline?session=${encodeURIComponent(sessionId)}`)
          .then(r => r.json())
          .then((events: TimelineEvent[]) => {
            editRangesRef.current = new Map()
            trackEditRanges(events)
            setTimeline(events)
          })
      })
    }

    return () => {
      es.close()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isLive, sessionId, trackEditRanges])

  // --- Smart scroll ---
  const prevLengthRef = useRef(0)
  useEffect(() => {
    const el = bodyRef.current
    if (!el || timeline.length === 0) return

    const newEvents = timeline.slice(prevLengthRef.current)
    prevLengthRef.current = timeline.length

    if (newEvents.length === 0) {
      // Full refetch — scroll to bottom
      el.scrollTo(0, el.scrollHeight)
      return
    }

    const hasUserEvent = newEvents.some(e => e.type === 'user')

    if (hasUserEvent && lastUserRef.current) {
      lastUserRef.current.scrollIntoView({ block: 'start' })
    } else if (isNearBottom(el)) {
      el.scrollTo(0, el.scrollHeight)
    }
    // If scrolled up and no user event, don't auto-scroll
  }, [timeline])

  // --- File click handler ---
  const handleTimelineClick = useCallback((evt: TimelineEvent) => {
    if (evt.filePath) {
      const ranges = editRangesRef.current.get(evt.filePath)
      onFileClick(evt.filePath, ranges)
    }
  }, [onFileClick])

  // Find index of last user event for ref attachment
  const lastUserIndex = useMemo(() => {
    for (let i = timeline.length - 1; i >= 0; i--) {
      if (timeline[i].type === 'user') return i
    }
    return -1
  }, [timeline])

  return (
    <div className={styles.tc}>
      <div className={styles.tcHeader}>
        {isLive && <span className={styles.tcLive}>●</span>}
        <span className={styles.tcLabel}>{sessionLabel}</span>
        {isArchive && (
          <button className={styles.tcClose} onClick={onClose}>×</button>
        )}
      </div>
      <div className={styles.tcBody} ref={bodyRef}>
        {fetchError ? (
          <div className={styles.tcEmpty}>Failed to load: {fetchError}</div>
        ) : timeline.length === 0 ? (
          <div className={styles.tcEmpty}>Waiting for agent activity...</div>
        ) : (
          <>
            {timeline.map((evt, i) => (
              <div key={`${evt.ts}-${i}`} ref={i === lastUserIndex ? lastUserRef : undefined}>
                <TimelineItem evt={evt} onClick={handleTimelineClick} />
              </div>
            ))}
            {lastUserIndex >= 0 && <div className={styles.tcSpacer} />}
          </>
        )}
      </div>
    </div>
  )
}

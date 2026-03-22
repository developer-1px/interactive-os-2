import styles from './TimelineColumn.module.css'
import { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react'
import {
  Circle, FileText, Terminal,
  Pencil, Search, FilePlus,
} from 'lucide-react'
import { DEFAULT_ROOT } from './types'
import { useVirtualScroll } from './useVirtualScroll'
import Markdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'

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
  if (evt.tool === 'Read') return <FileText size={12} />
  if (evt.tool === 'Edit') return <Pencil size={12} />
  if (evt.tool === 'Write') return <FilePlus size={12} />
  if (evt.tool === 'Bash') return <Terminal size={12} />
  if (evt.tool === 'Grep' || evt.tool === 'Glob') return <Search size={12} />
  return <Circle size={12} />
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
  const showIcon = evt.type === 'tool_use'
  const cls = `${styles.tcItem} ${typeClass}${evt.filePath ? ` ${styles.tcFile}` : ''}`
  return (
    <div
      className={cls}
      onClick={() => onClick(evt)}
    >
      {showIcon && (
        <span className={styles.tcIcon}>
          <EventIcon evt={evt} />
        </span>
      )}
      <span className={styles.tcText}>
        {evt.type === 'assistant' && evt.text
          ? <Markdown remarkPlugins={[remarkGfm, remarkBreaks]}>{evt.text}</Markdown>
          : eventLabel(evt)}
      </span>
    </div>
  )
})

// --- Component ---

const INITIAL_TAIL = 80
const LOAD_MORE_CHUNK = 100

export function TimelineColumn({ sessionId, sessionLabel, isLive, isArchive, onClose, onFileClick }: TimelineColumnProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const totalRef = useRef(0)        // total events on server
  const loadedFromRef = useRef(0)   // how far back we've loaded (server index)
  const loadingMoreRef = useRef(false)

  // Track editRanges per file for onFileClick
  const editRangesRef = useRef<Map<string, string[]>>(new Map())

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

  // --- Virtual scroll ---
  const spacerHeight = 2000
  const { containerRef, totalHeight, visibleRange, offsetTop, measureItem, scrollToIndex } = useVirtualScroll({
    itemCount: timeline.length,
    estimatedItemHeight: 40,
    overscan: 10,
  })

  // --- Initial timeline fetch (tail only) ---
  useEffect(() => {
    fetch(`/api/agent-ops/timeline?session=${encodeURIComponent(sessionId)}&tail=${INITIAL_TAIL}`)
      .then(r => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json() })
      .then((data: { events: TimelineEvent[]; total: number }) => {
        editRangesRef.current = new Map()
        trackEditRanges(data.events)
        setTimeline(data.events)
        totalRef.current = data.total
        loadedFromRef.current = Math.max(0, data.total - data.events.length)
        setFetchError(null)
      })
      .catch(e => setFetchError(e.message))
  }, [sessionId, trackEditRanges])

  // --- Load older events on scroll-up ---
  const loadOlder = useCallback(() => {
    if (loadingMoreRef.current || loadedFromRef.current <= 0) return
    loadingMoreRef.current = true

    const before = loadedFromRef.current
    fetch(`/api/agent-ops/timeline?session=${encodeURIComponent(sessionId)}&tail=${LOAD_MORE_CHUNK}&before=${before}`)
      .then(r => r.json())
      .then((data: { events: TimelineEvent[]; total: number }) => {
        if (data.events.length > 0) {
          trackEditRanges(data.events)
          setTimeline(prev => [...data.events, ...prev])
          loadedFromRef.current = Math.max(0, before - data.events.length)
        }
      })
      .finally(() => { loadingMoreRef.current = false })
  }, [sessionId, trackEditRanges])

  // Detect scroll near top → load more
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const handleScroll = () => {
      if (el.scrollTop < 200 && loadedFromRef.current > 0) {
        loadOlder()
      }
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [containerRef, loadOlder])

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
      totalRef.current += batch.length
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
        fetch(`/api/agent-ops/timeline?session=${encodeURIComponent(sessionId)}&tail=${INITIAL_TAIL}`)
          .then(r => r.json())
          .then((data: { events: TimelineEvent[]; total: number }) => {
            editRangesRef.current = new Map()
            trackEditRanges(data.events)
            setTimeline(data.events)
            totalRef.current = data.total
            loadedFromRef.current = Math.max(0, data.total - data.events.length)
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
  const initialLoadRef = useRef(true)
  useEffect(() => {
    const el = containerRef.current
    if (!el || timeline.length === 0) return

    if (initialLoadRef.current) {
      initialLoadRef.current = false
      prevLengthRef.current = timeline.length
      // 초기 80개만 로드 → 바로 맨 아래로
      requestAnimationFrame(() => {
        el.scrollTo(0, el.scrollHeight)
        // 한 프레임 더 — virtual scroll 측정 후 보정
        requestAnimationFrame(() => el.scrollTo(0, el.scrollHeight))
      })
      return
    }

    const prevLen = prevLengthRef.current
    const newLen = timeline.length

    // prepend (load older) — 스크롤 위치 보존
    if (newLen > prevLen && prevLen > 0) {
      const addedAtFront = newLen - prevLen
      // 맨 앞에 추가된 경우인지 확인 (SSE append와 구분)
      const isAppend = timeline[newLen - 1] !== timeline[prevLen - 1]

      if (!isAppend && addedAtFront > 0) {
        // prepend — 스크롤 위치 보정
        prevLengthRef.current = newLen
        return
      }
    }

    prevLengthRef.current = newLen
    const newEvents = timeline.slice(prevLen)

    if (newEvents.length === 0) return

    const hasUserEvent = newEvents.some(e => e.type === 'user')

    if (hasUserEvent) {
      const lastUser = findLastUserIndex(timeline)
      if (lastUser >= 0) scrollToIndex(lastUser, 'start')
    } else if (isNearBottom(el)) {
      el.scrollTo(0, el.scrollHeight)
    }
  }, [timeline, scrollToIndex, containerRef])

  // --- File click handler ---
  const handleTimelineClick = useCallback((evt: TimelineEvent) => {
    if (evt.filePath) {
      const ranges = editRangesRef.current.get(evt.filePath)
      onFileClick(evt.filePath, ranges)
    }
  }, [onFileClick])

  // Find index of last user event for spacer
  const lastUserIndex = useMemo(() => findLastUserIndex(timeline), [timeline])

  // Ref callback to measure each rendered item
  const makeMeasureRef = useCallback(
    (index: number) => (node: HTMLDivElement | null) => {
      if (!node) return
      const h = node.getBoundingClientRect().height
      if (h > 0) measureItem(index, h)
    },
    [measureItem],
  )

  // Total content height including spacer
  const contentHeight = totalHeight + (lastUserIndex >= 0 ? spacerHeight : 0)

  return (
    <div className={styles.tc}>
      <div className={styles.tcHeader}>
        {isLive && <span className={styles.tcLive}>●</span>}
        <span className={styles.tcLabel}>{sessionLabel}</span>
        {isArchive && (
          <button className={styles.tcClose} onClick={onClose}>×</button>
        )}
      </div>
      <div className={styles.tcBody} ref={containerRef}>
        {fetchError ? (
          <div className={styles.tcEmpty}>Failed to load: {fetchError}</div>
        ) : timeline.length === 0 ? (
          <div className={styles.tcEmpty}>Waiting for agent activity...</div>
        ) : (
          <div style={{ height: contentHeight, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${offsetTop}px)` }}>
              {timeline.slice(visibleRange.start, visibleRange.end).map((evt, i) => {
                const actualIndex = visibleRange.start + i
                return (
                  <div key={`${evt.ts}-${actualIndex}`} ref={makeMeasureRef(actualIndex)}>
                    <TimelineItem evt={evt} onClick={handleTimelineClick} />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function findLastUserIndex(timeline: TimelineEvent[]): number {
  for (let i = timeline.length - 1; i >= 0; i--) {
    if (timeline[i].type === 'user') return i
  }
  return -1
}

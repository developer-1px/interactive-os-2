import styles from './TimelineColumn.module.css'
import { useState, useEffect, useRef, useCallback, useMemo, memo, type ReactNode } from 'react'
import {
  Circle, FileText, Terminal,
  Pencil, Search, FilePlus, Loader,
} from 'lucide-react'
import { DEFAULT_ROOT } from './types'
import { useVirtualScroll } from './useVirtualScroll'
import { groupEvents, type TimelineEvent, type ToolGroup } from './groupEvents'
import { subscribeTimeline } from './timelineSSE'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'


interface TimelineColumnProps {
  sessionId: string
  sessionLabel: string
  isLive: boolean
  onClose: () => void
  onFileClick: (filePath: string, editRanges?: string[]) => void
  onModifiedFilesChange?: (files: string[]) => void
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

// --- Event icon ---

function EventIcon({ evt }: { evt: TimelineEvent }) {
  if (evt.tool === 'Read') return <FileText size={12} />
  if (evt.tool === 'Edit') return <Pencil size={12} />
  if (evt.tool === 'Write') return <FilePlus size={12} />
  if (evt.tool === 'Bash') return <Terminal size={12} />
  if (evt.tool === 'Grep' || evt.tool === 'Glob') return <Search size={12} />
  return <Circle size={12} />
}

// --- File path detection in markdown text ---

// Matches relative file paths with extensions (e.g. docs/foo/bar.md, src/App.tsx)
// Excludes URLs (http://, https://) and bare filenames without directory
const FILE_PATH_RE = /(?<![a-zA-Z0-9:/.])([a-zA-Z._][a-zA-Z0-9._-]*\/[a-zA-Z0-9._\-/]+\.[a-zA-Z0-9]+)/g

function splitByFilePaths(text: string, onFileClick: (absPath: string) => void): ReactNode[] {
  const parts: ReactNode[] = []
  let lastIndex = 0
  for (const match of text.matchAll(FILE_PATH_RE)) {
    const path = match[1]
    const start = match.index!
    if (start > lastIndex) parts.push(text.slice(lastIndex, start))
    const absPath = `${DEFAULT_ROOT}/${path}`
    parts.push(
      <span
        key={`fp-${start}`}
        className={styles.tcFilePath}
        onClick={(e) => { e.stopPropagation(); onFileClick(absPath) }}
      >
        {path}
      </span>,
    )
    lastIndex = start + path.length
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex))
  return parts
}

function createMarkdownComponents(onFileClick: (absPath: string) => void): Components {
  return {
    // Override text rendering inside paragraphs, list items, etc.
    p({ children }) {
      return <p>{processChildren(children, onFileClick)}</p>
    },
    li({ children }) {
      return <li>{processChildren(children, onFileClick)}</li>
    },
    td({ children }) {
      return <td>{processChildren(children, onFileClick)}</td>
    },
    // Inline code: detect file paths
    code({ children, className }) {
      // Skip code blocks (they have a className like language-*)
      if (className) return <code className={className}>{children}</code>
      const text = typeof children === 'string' ? children : ''
      if (text && FILE_PATH_RE.test(text)) {
        FILE_PATH_RE.lastIndex = 0
        return <code>{splitByFilePaths(text, onFileClick)}</code>
      }
      return <code>{children}</code>
    },
  }
}

function processChildren(children: ReactNode, onFileClick: (absPath: string) => void): ReactNode {
  if (typeof children === 'string') {
    const parts = splitByFilePaths(children, onFileClick)
    return parts.length === 1 && typeof parts[0] === 'string' ? children : parts
  }
  if (Array.isArray(children)) {
    return children.map((child, i) => {
      if (typeof child === 'string') {
        const parts = splitByFilePaths(child, onFileClick)
        return parts.length === 1 && typeof parts[0] === 'string'
          ? child
          : <span key={i}>{parts}</span>
      }
      return child
    })
  }
  return children
}

// --- Timeline item (memoized) ---

const TimelineItem = memo(function TimelineItem({ evt, onFileClick }: { evt: TimelineEvent; onFileClick: (absPath: string) => void }) {
  if (evt.type === 'assistant') {
    return (
      <div className={`${styles.tcItem} ${styles.tcAssistant}`}>
        <span className={styles.tcText}>
          {evt.text
            ? <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={createMarkdownComponents(onFileClick)}>{evt.text}</Markdown>
            : eventLabel(evt)}
        </span>
      </div>
    )
  }

  return (
    <div className={`${styles.tcItem} ${styles.tcUser}`}>
      <span className={styles.tcText}>{eventLabel(evt)}</span>
    </div>
  )
})

const ToolGroupCard = memo(function ToolGroupCard({ group, onClick }: { group: ToolGroup; onClick: (evt: TimelineEvent) => void }) {
  return (
    <div className={styles.tcToolGroup}>
      {group.events.map((evt, i) => {
        const toolClass = styles[`tc${evt.tool ?? ''}`] ?? ''
        return (
          <div
            key={`${evt.ts}-${i}`}
            className={`${styles.tcToolRow} ${toolClass}${evt.filePath ? ` ${styles.tcFile}` : ''}${i < group.events.length - 1 ? ` ${styles.tcToolDivider}` : ''}`}
            onClick={() => onClick(evt)}
          >
            <span className={styles.tcIcon}>
              <EventIcon evt={evt} />
            </span>
            <span className={styles.tcText}>{eventLabel(evt)}</span>
          </div>
        )
      })}
    </div>
  )
})

// --- Component ---

const INITIAL_TAIL = 80
const LOAD_MORE_CHUNK = 100

export function TimelineColumn({ sessionId, sessionLabel, isLive, onClose, onFileClick, onModifiedFilesChange }: TimelineColumnProps) {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const totalRef = useRef(0)        // total events on server
  const loadedFromRef = useRef(0)   // how far back we've loaded (server index)
  const loadingMoreRef = useRef(false)

  // Track editRanges per file for onFileClick
  const editRangesRef = useRef<Map<string, string[]>>(new Map())

  const trackEditRanges = useCallback((events: TimelineEvent[]) => {
    let changed = false
    for (const evt of events) {
      if (evt.type !== 'tool_use') continue
      if ((evt.tool === 'Edit' || evt.tool === 'Write') && evt.filePath && evt.editNew) {
        const existing = editRangesRef.current.get(evt.filePath)
        if (existing) {
          existing.push(evt.editNew)
        } else {
          editRangesRef.current.set(evt.filePath, [evt.editNew])
          changed = true
        }
      }
    }
    if (changed && onModifiedFilesChange) {
      onModifiedFilesChange([...editRangesRef.current.keys()])
    }
  }, [onModifiedFilesChange])

  // --- Agent status: running / idle / done ---
  const [agentStatus, setAgentStatus] = useState<'running' | 'idle' | 'done'>(isLive ? 'idle' : 'done')
  const [runStartTs, setRunStartTs] = useState<number | null>(null)
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const markRunning = useCallback(() => {
    setAgentStatus('running')
    setRunStartTs(prev => prev ?? Date.now())
    if (idleTimerRef.current) { clearTimeout(idleTimerRef.current); idleTimerRef.current = null }
  }, [])

  const scheduleIdle = useCallback(() => {
    if (idleTimerRef.current) clearTimeout(idleTimerRef.current)
    idleTimerRef.current = setTimeout(() => {
      setAgentStatus('idle')
      setRunStartTs(null)
    }, 3000)
  }, [])

  // Derive status from incoming events
  const updateStatusFromEvent = useCallback((evt: TimelineEvent) => {
    if (evt.type === 'user') {
      markRunning()
    } else if (evt.type === 'tool_use' || evt.type === 'tool_result') {
      markRunning()
    } else if (evt.type === 'assistant') {
      scheduleIdle()
    }
  }, [markRunning, scheduleIdle])

  // Set initial status from loaded timeline
  useEffect(() => {
    if (!isLive) {
      queueMicrotask(() => setAgentStatus('done'))
      return
    }
    if (timeline.length === 0) return
    const last = timeline[timeline.length - 1]
    if (last.type === 'user' || last.type === 'tool_use' || last.type === 'tool_result') {
      queueMicrotask(() => markRunning())
    } else {
      queueMicrotask(() => { setAgentStatus('idle'); setRunStartTs(null) })
    }
    return () => { if (idleTimerRef.current) clearTimeout(idleTimerRef.current) }
  }, [isLive]) // eslint-disable-line react-hooks/exhaustive-deps -- initial status only

  // --- Group events for display ---
  const displayItems = useMemo(() => groupEvents(timeline), [timeline])

  // --- Virtual scroll ---
  const { containerRef, totalHeight, visibleRange, offsetTop, measureItem, recalc } = useVirtualScroll({
    itemCount: displayItems.length,
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

  // --- SSE via shared multiplexed connection ---
  useEffect(() => {
    if (!isLive) return

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

    const unsubscribe = subscribeTimeline(sessionId, (evt) => {
      pendingEvents.push(evt)
      updateStatusFromEvent(evt)
      if (!rafId) rafId = requestAnimationFrame(flushPending)
    })

    return () => {
      unsubscribe()
      if (rafId) cancelAnimationFrame(rafId)
    }
  }, [isLive, sessionId, trackEditRanges, updateStatusFromEvent])

  // --- Smart scroll ---
  const prevLengthRef = useRef(0)
  const initialLoadRef = useRef(true)

  const scrollToBottom = useCallback(() => {
    const el = containerRef.current
    if (!el) return
    // Multi-pass: scroll, recalc (renders new items), scroll again with correct heights
    requestAnimationFrame(() => {
      el.scrollTo(0, el.scrollHeight)
      recalc()
      requestAnimationFrame(() => {
        el.scrollTo(0, el.scrollHeight)
        recalc()
        // Third pass for items that just got measured
        requestAnimationFrame(() => {
          el.scrollTo(0, el.scrollHeight)
          recalc()
        })
      })
    })
  }, [containerRef, recalc])

  useEffect(() => {
    const el = containerRef.current
    if (!el || displayItems.length === 0) return

    if (initialLoadRef.current) {
      initialLoadRef.current = false
      prevLengthRef.current = displayItems.length
      // Use scrollToIndex to reliably reach the bottom
      scrollToBottom()
      return
    }

    const prevLen = prevLengthRef.current
    const newLen = displayItems.length

    if (newLen > prevLen && prevLen > 0) {
      const isAppend = displayItems[newLen - 1] !== displayItems[prevLen - 1]
      if (!isAppend) {
        prevLengthRef.current = newLen
        return
      }
    }

    prevLengthRef.current = newLen
    scrollToBottom()
  }, [displayItems, containerRef, scrollToBottom])

  // --- File click handler ---
  const handleTimelineClick = useCallback((evt: TimelineEvent) => {
    if (evt.filePath) {
      const ranges = editRangesRef.current.get(evt.filePath)
      onFileClick(evt.filePath, ranges)
    }
  }, [onFileClick])

  // Ref callback to measure each rendered item
  const makeMeasureRef = useCallback(
    (index: number) => (node: HTMLDivElement | null) => {
      if (!node) return
      const h = node.getBoundingClientRect().height
      if (h > 0) measureItem(index, h)
    },
    [measureItem],
  )

  const contentHeight = totalHeight

  return (
    <div className={styles.tc}>
      <div className={`${styles.tcHeader} ${isLive && agentStatus === 'idle' ? styles.tcHeaderIdle : ''}`}>
        {isLive && (
          <span className={agentStatus === 'idle' ? styles.tcIdle : styles.tcLive}>●</span>
        )}
        <span className={styles.tcLabel}>{sessionLabel}</span>
        {isLive && (
          <span className={styles.tcHeaderStatus}>
            {agentStatus === 'running' ? '진행중' : agentStatus === 'idle' ? '입력 대기' : ''}
          </span>
        )}
        <button className={styles.tcClose} onClick={onClose}>×</button>
      </div>
      <div className={styles.tcBody} ref={containerRef}>
        {fetchError ? (
          <div className={styles.tcEmpty}>Failed to load: {fetchError}</div>
        ) : displayItems.length === 0 ? (
          <div className={styles.tcEmpty}>Waiting for agent activity...</div>
        ) : (
          <div style={{ height: contentHeight, position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, transform: `translateY(${offsetTop}px)` }}>
              {displayItems.slice(visibleRange.start, visibleRange.end).map((item, i) => {
                const actualIndex = visibleRange.start + i
                if (item.type === 'tool_group') {
                  return (
                    <div key={`grp-${item.events[0].ts}-${actualIndex}`} ref={makeMeasureRef(actualIndex)}>
                      <ToolGroupCard group={item} onClick={handleTimelineClick} />
                    </div>
                  )
                }
                return (
                  <div key={`${item.ts}-${actualIndex}`} ref={makeMeasureRef(actualIndex)} className={item.type === 'user' ? styles.tcUserWrap : undefined}>
                    <TimelineItem evt={item} onFileClick={onFileClick} />
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>
      {isLive && agentStatus === 'running' && (
        <AgentRunningBar startTs={runStartTs} />
      )}
      {isLive && agentStatus === 'idle' && (
        <ChatInput sessionId={sessionId} />
      )}
    </div>
  )
}

function AgentRunningBar({ startTs }: { startTs: number | null }) {
  const [elapsed, setElapsed] = useState(() => startTs != null ? Math.floor((Date.now() - startTs) / 1000) : 0)

  useEffect(() => {
    if (startTs == null) return
    const id = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTs) / 1000))
    }, 1000)
    return () => clearInterval(id)
  }, [startTs])

  return (
    <div className={styles.tcStatus}>
      <Loader size={12} className={styles.tcStatusSpinner} />
      <span>Running {elapsed}s</span>
    </div>
  )
}

// const CHANNEL_URL = 'http://127.0.0.1:8788'

 
function ChatInput({ sessionId: _sessionId }: { sessionId: string }) {
  const [text, setText] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)

  return (
    <div className={styles.tcInput}>
      <textarea
        ref={ref}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Send a message... (channel 미연결)"
        rows={1}
        disabled
      />
    </div>
  )
}


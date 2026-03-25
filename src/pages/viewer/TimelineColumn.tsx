import styles from './TimelineColumn.module.css'
import { useState, useEffect, useRef, useCallback, useMemo, memo, type ReactNode } from 'react'
import {
  Circle, FileText, Terminal,
  Pencil, Search, FilePlus, Loader, X,
} from 'lucide-react'
import { DEFAULT_ROOT } from './types'
import { groupEvents, type TimelineEvent, type ToolGroup, type DisplayItem } from './groupEvents'
import { connectSession, disconnectSession, useTimeline, useSessionMeta, loadOlder, canLoadMore, getEditRanges } from './viewerStore'
import { useStreamFeed } from '../../interactive-os/ui/useStreamFeed'
import { StreamFeed, StreamCursor } from '../../interactive-os/ui/StreamFeed'
import { useTypewriter } from '../../interactive-os/ui/useTypewriter'
import Markdown, { type Components } from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkBreaks from 'remark-breaks'


interface TimelineColumnProps {
  sessionId: string
  sessionLabel: string
  isLive: boolean
  onClose: () => void
  onFileClick: (filePath: string, editRanges?: string[]) => void
}

// --- Pacing delays by item type ---

function getItemDelay(item: DisplayItem): number {
  if (item.type === 'assistant') return 400
  if (item.type === 'tool_group') return 150
  if (item.type === 'user') return 0
  // tool_use, tool_result
  return 100
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
    p({ children }) {
      return <p>{processChildren(children, onFileClick)}</p>
    },
    li({ children }) {
      return <li>{processChildren(children, onFileClick)}</li>
    },
    td({ children }) {
      return <td>{processChildren(children, onFileClick)}</td>
    },
    code({ children, className }) {
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

const TimelineItem = memo(function TimelineItem({ evt, onFileClick, isLatest }: { evt: TimelineEvent; onFileClick: (absPath: string) => void; isLatest?: boolean }) {
  if (evt.type === 'assistant') {
    return isLatest && evt.text
      ? <AssistantTypewriter text={evt.text} onFileClick={onFileClick} />
      : (
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

function AssistantTypewriter({ text, onFileClick }: { text: string; onFileClick: (absPath: string) => void }) {
  const { displayed, done } = useTypewriter(text, true, 120, 1, 'line')
  return (
    <div className={`${styles.tcItem} ${styles.tcAssistant}`}>
      <span className={styles.tcText}>
        <Markdown remarkPlugins={[remarkGfm, remarkBreaks]} components={createMarkdownComponents(onFileClick)}>{displayed}</Markdown>
        {!done && <StreamCursor />}
      </span>
    </div>
  )
}

// --- Rich Tool Preview ---

function ToolCodePreview({ code, maxLines = 8 }: { code: string; maxLines?: number }) {
  const lines = code.split('\n')
  const truncated = lines.length > maxLines
  const display = truncated ? lines.slice(0, maxLines).join('\n') : code
  return (
    <div className={styles.tcCodePreview}>
      <pre>{display}</pre>
      {truncated && <div className={styles.tcCodeFade}>+{lines.length - maxLines} lines</div>}
    </div>
  )
}

const ToolGroupCard = memo(function ToolGroupCard({ group, onClick }: { group: ToolGroup; onClick: (evt: TimelineEvent) => void }) {
  return (
    <div className={styles.tcToolGroup}>
      {group.events.map((evt, i) => {
        const toolClass = styles[`tc${evt.tool ?? ''}`] ?? ''
        const hasPreview = (evt.tool === 'Edit' || evt.tool === 'Write') && evt.editNew
        return (
          <div key={`${evt.ts}-${i}`}>
            <div
              className={`${styles.tcToolRow} ${toolClass}${evt.filePath ? ` ${styles.tcFile}` : ''}${!hasPreview && i < group.events.length - 1 ? ` ${styles.tcToolDivider}` : ''}`}
              onClick={() => onClick(evt)}
            >
              <span className={styles.tcIcon}>
                <EventIcon evt={evt} />
              </span>
              <span className={styles.tcText}>{eventLabel(evt)}</span>
            </div>
            {hasPreview && (
              <div className={i < group.events.length - 1 ? styles.tcToolDivider : undefined}>
                <ToolCodePreview code={evt.editNew!} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})

// --- Pacing hook: reveal items progressively ---

function usePacedReveal(displayItems: DisplayItem[], isInitialLoad: boolean) {
  const [revealedCount, setRevealedCount] = useState(0)
  const prevLenRef = useRef(0)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  useEffect(() => {
    const total = displayItems.length
    const prev = prevLenRef.current
    prevLenRef.current = total

    // Initial load or fewer items (reload) — show all immediately
    if (isInitialLoad || total <= prev || prev === 0) {
      queueMicrotask(() => setRevealedCount(total))
      return
    }

    // New items arrived — pace them
    const newItems = displayItems.slice(prev)
    let accDelay = 0

    newItems.forEach((item, i) => {
      accDelay += getItemDelay(item)
      const target = prev + i + 1
      const timerId = setTimeout(() => setRevealedCount(target), accDelay)
      timersRef.current.push(timerId)
    })

    return () => {
      for (const id of timersRef.current) clearTimeout(id)
      timersRef.current = []
    }
  }, [displayItems, isInitialLoad])

  const isPacing = revealedCount < displayItems.length
  const visibleItems = displayItems.slice(0, revealedCount)

  return { visibleItems, isPacing }
}

// --- Component ---

export function TimelineColumn({ sessionId, sessionLabel, isLive, onClose, onFileClick }: TimelineColumnProps) {
  // --- Store connection ---
  useEffect(() => {
    connectSession(sessionId, isLive)
    return () => disconnectSession(sessionId)
  }, [sessionId, isLive])

  const timeline = useTimeline(sessionId)
  const { agentStatus, runStartTs, fetchError, initialLoading } = useSessionMeta(sessionId)

  // --- Group events for display ---
  const displayItems = useMemo(() => groupEvents(timeline), [timeline])

  // --- Paced reveal (live events get delays, initial load is immediate) ---
  const { visibleItems, isPacing } = usePacedReveal(displayItems, initialLoading)

  // --- StreamFeed for entry animation ---
  const { feedRef } = useStreamFeed<DisplayItem>()

  // --- Smart auto-scroll ---
  const prevVisibleLenRef = useRef(0)
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const userScrolledUpRef = useRef(false)

  // Track if user scrolled up
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 60
      userScrolledUpRef.current = !nearBottom
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [feedRef])

  useEffect(() => {
    const el = feedRef.current
    if (!el || visibleItems.length === 0) return

    const newLen = visibleItems.length
    const prevLen = prevVisibleLenRef.current
    prevVisibleLenRef.current = newLen

    if (newLen <= prevLen) return

    // Initial load: instant scroll, no debounce
    if (prevLen === 0) {
      requestAnimationFrame(() => {
        el.scrollTo({ top: el.scrollHeight, behavior: 'instant' })
      })
      return
    }

    // User scrolled up: don't auto-scroll
    if (userScrolledUpRef.current) return

    // Debounce: wait for pacing + animation to settle before scrolling
    if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    scrollTimerRef.current = setTimeout(() => {
      scrollTimerRef.current = null
      if (userScrolledUpRef.current) return
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    }, 250)
  }, [visibleItems, feedRef])

  // Cleanup scroll timer
  useEffect(() => {
    return () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current)
    }
  }, [])

  // --- Load older events on scroll-up ---
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    const handleScroll = () => {
      if (el.scrollTop < 200 && canLoadMore(sessionId)) {
        loadOlder(sessionId)
      }
    }
    el.addEventListener('scroll', handleScroll, { passive: true })
    return () => el.removeEventListener('scroll', handleScroll)
  }, [feedRef, sessionId])

  // --- File click handler ---
  const handleTimelineClick = useCallback((evt: TimelineEvent) => {
    if (evt.filePath) {
      const ranges = getEditRanges(sessionId, evt.filePath)
      onFileClick(evt.filePath, ranges)
    }
  }, [sessionId, onFileClick])

  // Streaming: agent is running OR pacing queue is draining
  const showStreaming = (isLive && agentStatus === 'running') || isPacing

  // Streaming label based on what the agent is doing
  const lastVisible = visibleItems[visibleItems.length - 1]
  const streamingLabel = lastVisible?.type === 'tool_group' ? 'Executing' : 'Thinking'

  return (
    <div className={styles.tc}>
      <div className={`${styles.tcHeader} ${isLive && agentStatus === 'idle' ? styles.tcHeaderIdle : ''}`}>
        {isLive && (
          <span className={agentStatus === 'idle' ? styles.tcIdle : styles.tcLive}><Circle size={8} fill="currentColor" /></span>
        )}
        <span className={styles.tcLabel}>{sessionLabel}</span>
        {isLive && (
          <span className={styles.tcHeaderStatus}>
            {agentStatus === 'running' ? '진행중' : agentStatus === 'idle' ? '입력 대기' : ''}
          </span>
        )}
        <button className={styles.tcClose} onClick={onClose}><X size={14} /></button>
      </div>

      {fetchError ? (
        <div className={styles.tcEmpty}>Failed to load: {fetchError}</div>
      ) : initialLoading ? (
        <div className={styles.tcLoading}>
          <Loader size={14} className={styles.tcLoadingSpinner} />
          <span>Loading timeline...</span>
        </div>
      ) : visibleItems.length === 0 ? (
        <div className={styles.tcEmpty}>Waiting for agent activity...</div>
      ) : (
        <StreamFeed
          items={visibleItems}
          feedRef={feedRef}
          isStreaming={showStreaming}
          streamingLabel={streamingLabel}
          className={styles.tcBody}
          renderItem={(item, _i, { isLatest }) => {
            if (item.type === 'tool_group') {
              return <ToolGroupCard group={item} onClick={handleTimelineClick} />
            }
            return (
              <div className={item.type === 'user' ? styles.tcUserWrap : undefined}>
                <TimelineItem evt={item} onFileClick={onFileClick} isLatest={isLatest && item.type === 'assistant'} />
              </div>
            )
          }}
        />
      )}

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

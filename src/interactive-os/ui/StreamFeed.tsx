// ② 2026-03-25-stream-feed-prd.md
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import styles from './StreamFeed.module.css'

// --- Types ---

export interface StreamFeedProps<T> {
  items: T[]
  feedRef: React.RefObject<HTMLDivElement | null>
  renderItem: (item: T, index: number, meta: { isLatest: boolean }) => ReactNode
  isStreaming?: boolean
  /** Label shown in the streaming indicator (default: "Thinking") */
  streamingLabel?: string
  className?: string
}

// --- StreamingIndicator ---

function StreamingTimer() {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const id = setInterval(() => setElapsed(prev => prev + 1), 1000)
    return () => clearInterval(id)
  }, [])

  return <span className={styles.streamingTime}>{elapsed}s</span>
}

// --- StreamCursor (export for renderItem use) ---

export function StreamCursor() {
  return <span className={styles.cursor} />
}

// --- ScrollToBottom FAB ---

function ScrollToBottomButton({ feedRef }: { feedRef: React.RefObject<HTMLDivElement | null> }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 60
      setVisible(!nearBottom)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [feedRef])

  const scrollToBottom = useCallback(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
  }, [feedRef])

  if (!visible) return null

  return (
    <button className={`flex-row items-center justify-center ${styles.scrollFab}`} data-surface="action" onClick={scrollToBottom} aria-label="Scroll to bottom">
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
        <path d="M7 2v10M3 8l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  )
}

// --- StreamFeed ---

export function StreamFeed<T>({ items, feedRef, renderItem, isStreaming, streamingLabel, className }: StreamFeedProps<T>) {
  return (
    <div className={`flex-col ${styles.feedWrapper}`}>
      <div
        ref={feedRef}
        className={`flex-col ${styles.feed}${className ? ` ${className}` : ''}`}
        role="feed"
      >
        {items.map((item, i) => (
          <div key={i} className={styles.entry}>
            {renderItem(item, i, { isLatest: i === items.length - 1 })}
          </div>
        ))}
        {isStreaming && (
          <div className={`flex-row items-center ${styles.streaming}`}>
            <span className={styles.streamingDot} />
            <span className={styles.streamingLabel}>{streamingLabel ?? 'Thinking'}</span>
            <StreamingTimer />
          </div>
        )}
      </div>
      <ScrollToBottomButton feedRef={feedRef} />
    </div>
  )
}

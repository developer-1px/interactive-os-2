/** @catalog 스트리밍 데이터 실시간 피드 */
// ② 2026-03-25-stream-feed-prd.md
import { useState, useEffect, useCallback, type ReactNode } from 'react'
import { ax } from '@styles/ax'
import './StreamFeed.css'
import { DirectionIndicator } from './indicators'

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

  return <span className={ax({ textStyle: 'caption',  })}>{elapsed}s</span>
}

// --- StreamCursor (export for renderItem use) ---

export function StreamCursor() {
  return <span className={`${ax({ motion: 'blink' })} stream-cursor`} />
}

// --- ScrollToBottom FAB ---

function ScrollToBottomButton({ feedRef }: { feedRef: React.RefObject<HTMLDivElement | null> }) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 40
      setVisible(!nearBottom)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    el.addEventListener('scrollend', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      el.removeEventListener('scrollend', onScroll)
    }
  }, [feedRef])

  const scrollToBottom = useCallback(() => {
    feedRef.current?.scrollTo({ top: feedRef.current.scrollHeight, behavior: 'smooth' })
  }, [feedRef])

  if (!visible) return null

  return (
    <button className={`${ax({ role: 'control', surface: 'action', border: 'default', content: 'icon', placement: 'bottom-center', motion: 'fade-slide-in' })} stream-fab`} onClick={scrollToBottom} aria-label="Scroll to bottom">
      <DirectionIndicator direction="next" orientation="vertical" />
    </button>
  )
}

// --- StreamFeed ---

export function StreamFeed<T>({ items, feedRef, renderItem, isStreaming, streamingLabel, className }: StreamFeedProps<T>) {
  return (
    <div className={`${ax({ layout: 'fill', placement: 'relative' })}`}>
      <div
        ref={feedRef}
        className={`${ax({ layout: 'scroll', flex: '1', gap: 'xl' })} stream-feed${className ? ` ${className}` : ''}`}
        role="feed"
      >
        {items.map((item, i) => (
          <div key={i} data-feed-entry="" className={`${ax({ width: 'full', motion: 'fade-slide-in' })} stream-entry`}>
            {renderItem(item, i, { isLatest: i === items.length - 1 })}
          </div>
        ))}
        {isStreaming && (
          <div className={`${ax({ layout: 'bar', gap: 'sm', width: 'full', motion: 'fade-slide-in' })} stream-indicator`}>
            <span className={`${ax({ shape: 'pill', motion: 'pulse' })} stream-dot`} />
            <span className={ax({ textStyle: 'caption',  })}>{streamingLabel ?? 'Thinking'}</span>
            <StreamingTimer />
          </div>
        )}
      </div>
      <ScrollToBottomButton feedRef={feedRef} />
    </div>
  )
}

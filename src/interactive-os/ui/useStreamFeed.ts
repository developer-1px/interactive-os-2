// ② 2026-03-25-stream-feed-prd.md
import { useState, useRef, useCallback, useEffect } from 'react'

// --- Types ---

export interface UseStreamFeedOptions<T> {
  /** Pixel threshold from bottom to consider "at bottom" for auto-scroll */
  bottomThreshold?: number
  initialItems?: T[]
  /** Return ms delay before this item is released from queue. 0 = immediate. */
  getDelay?: (item: T) => number
}

export interface UseStreamFeedReturn<T> {
  items: T[]
  isStreaming: boolean
  feedRef: React.RefObject<HTMLDivElement | null>
  addItem: (item: T) => void
  addItems: (items: T[]) => void
  clear: () => void
  /** Scroll to bottom if user hasn't scrolled up. Call on external data changes. */
  scrollIfAtBottom: () => void
  /** Number of items waiting in the pacing queue */
  queueSize: number
}

// --- Auto-scroll helpers ---

function isNearBottom(el: HTMLElement, threshold: number): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold
}

// --- Hook ---

export function useStreamFeed<T>(options: UseStreamFeedOptions<T> = {}): UseStreamFeedReturn<T> {
  const { bottomThreshold = 40 } = options
  const getDelay = options.getDelay ?? null

  const [items, setItems] = useState<T[]>(() => options.initialItems ?? [])
  const [isStreaming, setIsStreaming] = useState(false)
  const [queueSize, setQueueSize] = useState(0)

  const feedRef = useRef<HTMLDivElement | null>(null)
  const pendingScrollRef = useRef(false)
  const rafIdRef = useRef(0)

  // --- Pacing queue ---
  const queueRef = useRef<T[]>([])
  const pacingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const getDelayRef = useRef(getDelay)
  useEffect(() => { getDelayRef.current = getDelay }, [getDelay])

  const flushNext = useCallback(function drain() {
    pacingTimerRef.current = null
    if (queueRef.current.length === 0) {
      setQueueSize(0)
      setIsStreaming(false)
      return
    }

    const next = queueRef.current.shift()!
    pendingScrollRef.current = true
    setItems(prev => [...prev, next])
    setQueueSize(queueRef.current.length)

    if (queueRef.current.length > 0) {
      const delay = getDelayRef.current ? getDelayRef.current(queueRef.current[0]) : 0
      pacingTimerRef.current = delay > 0 ? setTimeout(drain, delay) : (queueMicrotask(drain), null)
    } else {
      setIsStreaming(false)
    }
  }, [])

  useEffect(() => {
    return () => { if (pacingTimerRef.current) clearTimeout(pacingTimerRef.current) }
  }, [])

  // Track user scroll position
  const wasNearBottomRef = useRef(true)
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    const onScroll = () => {
      wasNearBottomRef.current = isNearBottom(el, bottomThreshold)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [bottomThreshold])

  // Flush pending scroll (batched via rAF)
  useEffect(() => {
    if (!pendingScrollRef.current) return
    pendingScrollRef.current = false
    if (!wasNearBottomRef.current) return
    const el = feedRef.current
    if (!el) return
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      rafIdRef.current = 0
    })
  }, [items])

  useEffect(() => {
    return () => { if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current) }
  }, [])

  const addItem = useCallback((item: T) => {
    if (!getDelayRef.current) {
      pendingScrollRef.current = true
      setItems(prev => [...prev, item])
      return
    }

    const wasEmpty = queueRef.current.length === 0 && !pacingTimerRef.current
    queueRef.current.push(item)
    setQueueSize(queueRef.current.length)
    setIsStreaming(true)

    if (wasEmpty) {
      const delay = getDelayRef.current(item)
      pacingTimerRef.current = delay > 0 ? setTimeout(flushNext, delay) : (queueMicrotask(flushNext), null)
    }
  }, [flushNext])

  const addItems = useCallback((batch: T[]) => {
    for (const item of batch) addItem(item)
  }, [addItem])

  const clear = useCallback(() => {
    queueRef.current = []
    if (pacingTimerRef.current) { clearTimeout(pacingTimerRef.current); pacingTimerRef.current = null }
    setQueueSize(0)
    setItems([])
    setIsStreaming(false)
    wasNearBottomRef.current = true
  }, [])

  const scrollIfAtBottom = useCallback(() => {
    if (!wasNearBottomRef.current) return
    const el = feedRef.current
    if (!el) return
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      rafIdRef.current = 0
    })
  }, [])

  return { items, isStreaming, feedRef, addItem, addItems, clear, scrollIfAtBottom, queueSize }
}

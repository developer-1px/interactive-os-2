// ② 2026-03-25-stream-feed-prd.md
import { useState, useRef, useCallback, useEffect } from 'react'

// --- Types ---

export interface SequenceItem<T> {
  data: T
  delay: number
}

interface UseStreamFeedOptionsBase {
  /** Pixel threshold from bottom to consider "at bottom" for auto-scroll */
  bottomThreshold?: number
}

interface UseStreamFeedPushOptions<T> extends UseStreamFeedOptionsBase {
  mode?: 'push'
  sequence?: never
  autoPlay?: never
  initialItems?: T[]
  /** Return ms delay before this item is released from queue. 0 = immediate. */
  getDelay?: (item: T) => number
}

interface UseStreamFeedSequenceOptions<T> extends UseStreamFeedOptionsBase {
  mode: 'sequence'
  sequence: SequenceItem<T>[]
  autoPlay?: boolean
  initialItems?: never
  getDelay?: never
}

type UseStreamFeedOptions<T> = UseStreamFeedPushOptions<T> | UseStreamFeedSequenceOptions<T>

export interface UseStreamFeedReturn<T> {
  items: T[]
  isStreaming: boolean
  feedRef: React.RefObject<HTMLDivElement | null>
  addItem: (item: T) => void
  addItems: (items: T[]) => void
  replay: () => void
  clear: () => void
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
  const getDelay = (options.mode !== 'sequence' && options.getDelay) ? options.getDelay : null

  const [items, setItems] = useState<T[]>(() =>
    'initialItems' in options && options.initialItems ? options.initialItems : [],
  )
  const [isStreaming, setIsStreaming] = useState(false)
  const [queueSize, setQueueSize] = useState(0)

  const feedRef = useRef<HTMLDivElement | null>(null)
  const userScrolledUpRef = useRef(false)
  const pendingScrollRef = useRef(false)
  const rafIdRef = useRef(0)

  // --- Pacing queue (push mode only) ---
  const queueRef = useRef<T[]>([])
  const pacingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const getDelayRef = useRef(getDelay)
  useEffect(() => { getDelayRef.current = getDelay }, [getDelay])

  const flushNext = useCallback(function drain() {
    pacingTimerRef.current = null
    if (queueRef.current.length === 0) {
      setQueueSize(0)
      return
    }

    const next = queueRef.current.shift()!
    pendingScrollRef.current = true
    setItems(prev => [...prev, next])
    setQueueSize(queueRef.current.length)

    // Schedule next if queue still has items
    if (queueRef.current.length > 0) {
      const delay = getDelayRef.current ? getDelayRef.current(queueRef.current[0]) : 0
      pacingTimerRef.current = setTimeout(drain, delay)
    }
  }, [])

  // Cleanup pacing timer on unmount
  useEffect(() => {
    return () => {
      if (pacingTimerRef.current) clearTimeout(pacingTimerRef.current)
    }
  }, [])

  // Track user scroll position
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    const onScroll = () => {
      userScrolledUpRef.current = !isNearBottom(el, bottomThreshold)
    }
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => el.removeEventListener('scroll', onScroll)
  }, [bottomThreshold])

  // Flush pending scroll (batched via rAF)
  useEffect(() => {
    if (!pendingScrollRef.current) return
    pendingScrollRef.current = false

    if (userScrolledUpRef.current) return

    const el = feedRef.current
    if (!el) return

    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    rafIdRef.current = requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
      rafIdRef.current = 0
    })
  }, [items])

  // Cleanup rAF on unmount
  useEffect(() => {
    return () => {
      if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current)
    }
  }, [])

  const addItem = useCallback((item: T) => {
    if (!getDelayRef.current) {
      // No pacing — immediate
      pendingScrollRef.current = true
      setItems(prev => [...prev, item])
      return
    }

    // Pacing mode: enqueue
    const wasEmpty = queueRef.current.length === 0 && !pacingTimerRef.current
    queueRef.current.push(item)
    setQueueSize(queueRef.current.length)

    if (wasEmpty) {
      // Release first item after its delay
      const delay = getDelayRef.current(item)
      if (delay <= 0) {
        queueMicrotask(flushNext)
      } else {
        pacingTimerRef.current = setTimeout(flushNext, delay)
      }
    }
  }, [flushNext])

  const addItems = useCallback((batch: T[]) => {
    if (batch.length === 0) return
    for (const item of batch) addItem(item)
  }, [addItem])

  const clear = useCallback(() => {
    queueRef.current = []
    if (pacingTimerRef.current) { clearTimeout(pacingTimerRef.current); pacingTimerRef.current = null }
    setQueueSize(0)
    setItems([])
    userScrolledUpRef.current = false
  }, [])

  // --- Sequence mode ---

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const clearTimers = useCallback(() => {
    for (const id of timersRef.current) clearTimeout(id)
    timersRef.current = []
  }, [])

  const sequence = options.mode === 'sequence' ? options.sequence : null
  const sequenceRef = useRef(sequence)
  const autoPlayRef = useRef(options.mode === 'sequence' && options.autoPlay)

  useEffect(() => {
    sequenceRef.current = sequence
  }, [sequence])

  const replay = useCallback(() => {
    const seq = sequenceRef.current
    if (!seq) return

    clearTimers()
    setItems([])
    setIsStreaming(true)
    userScrolledUpRef.current = false

    let total = 0

    seq.forEach((entry, i) => {
      total += entry.delay
      const isLast = i === seq.length - 1
      const timerId = setTimeout(() => {
        pendingScrollRef.current = true
        setItems(prev => [...prev, entry.data])
        if (isLast) setIsStreaming(false)
      }, total)
      timersRef.current.push(timerId)
    })
  }, [clearTimers])

  // Auto-play on mount for sequence mode
  const didAutoPlayRef = useRef(false)
  useEffect(() => {
    if (autoPlayRef.current && !didAutoPlayRef.current) {
      didAutoPlayRef.current = true
      queueMicrotask(() => replay())
    }
    return clearTimers
  }, [replay, clearTimers])

  return { items, isStreaming, feedRef, addItem, addItems, replay, clear, queueSize }
}

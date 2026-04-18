var e=`import { useRef, useCallback, useEffect, useState } from 'react'

// --- Pure timing queue: releases items one at a time with delays ---

export interface UseAnimationQueueOptions<T> {
  /** Delay before releasing each item. Called with the item about to be released. */
  getDelay?: (item: T) => number
  /** Called when an item is released from the queue. */
  onRelease: (item: T) => void
}

export interface UseAnimationQueueReturn<T> {
  enqueue: (item: T) => void
  enqueueAll: (items: T[]) => void
  clear: () => void
  isRunning: boolean
  queueSize: number
}

export function useAnimationQueue<T>(options: UseAnimationQueueOptions<T>): UseAnimationQueueReturn<T> {
  const [isRunning, setIsRunning] = useState(false)
  const [queueSize, setQueueSize] = useState(0)

  const queueRef = useRef<T[]>([])
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onReleaseRef = useRef(options.onRelease)
  const getDelayRef = useRef(options.getDelay ?? null)

  useEffect(() => { onReleaseRef.current = options.onRelease }, [options.onRelease])
  useEffect(() => { getDelayRef.current = options.getDelay ?? null }, [options.getDelay])

  const releaseNext = useCallback(function drain() {
    timerRef.current = null

    if (queueRef.current.length === 0) {
      setIsRunning(false)
      setQueueSize(0)
      return
    }

    const item = queueRef.current.shift()!
    setQueueSize(queueRef.current.length)
    onReleaseRef.current(item)

    if (queueRef.current.length > 0) {
      const delay = getDelayRef.current ? getDelayRef.current(queueRef.current[0]) : 0
      timerRef.current = delay > 0 ? setTimeout(drain, delay) : (queueMicrotask(drain), null)
    } else {
      setIsRunning(false)
    }
  }, [])

  const enqueue = useCallback((item: T) => {
    const wasEmpty = queueRef.current.length === 0 && !timerRef.current
    queueRef.current.push(item)
    setQueueSize(queueRef.current.length)
    setIsRunning(true)

    if (wasEmpty) {
      const delay = getDelayRef.current ? getDelayRef.current(item) : 0
      timerRef.current = delay > 0 ? setTimeout(releaseNext, delay) : (queueMicrotask(releaseNext), null)
    }
  }, [releaseNext])

  const enqueueAll = useCallback((items: T[]) => {
    for (const item of items) enqueue(item)
  }, [enqueue])

  const clear = useCallback(() => {
    queueRef.current = []
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    setQueueSize(0)
    setIsRunning(false)
  }, [])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  return { enqueue, enqueueAll, clear, isRunning, queueSize }
}
`;export{e as default};
import { useRef, useState, useEffect, useCallback, type RefObject } from 'react'

interface UseVirtualScrollOptions {
  itemCount: number
  estimatedItemHeight: number
  overscan?: number
}

interface VisibleRange {
  start: number
  end: number
}

interface UseVirtualScrollReturn {
  containerRef: RefObject<HTMLDivElement>
  totalHeight: number
  visibleRange: VisibleRange
  offsetTop: number
  measureItem: (index: number, height: number) => void
  scrollToIndex: (index: number, block?: 'start' | 'end') => void
  recalc: () => void
}

export function useVirtualScroll({
  itemCount,
  estimatedItemHeight,
  overscan = 5,
}: UseVirtualScrollOptions): UseVirtualScrollReturn {
  const containerRef = useRef<HTMLDivElement>(null!)
  const heightCache = useRef(new Map<number, number>())
  const rafId = useRef(0)

  const [visibleRange, setVisibleRange] = useState<VisibleRange>({ start: 0, end: 0 })
  const [totalHeight, setTotalHeight] = useState(0)
  const [offsetTop, setOffsetTop] = useState(0)

  // Get height of item at index
  const getItemHeight = useCallback(
    (index: number) => heightCache.current.get(index) ?? estimatedItemHeight,
    [estimatedItemHeight],
  )

  // Compute total height of all items
  const computeTotalHeight = useCallback(() => {
    let h = 0
    for (let i = 0; i < itemCount; i++) h += getItemHeight(i)
    return h
  }, [itemCount, getItemHeight])

  // Compute the top offset (Y position) for a given item index
  const getOffsetForIndex = useCallback(
    (index: number) => {
      let offset = 0
      for (let i = 0; i < index; i++) offset += getItemHeight(i)
      return offset
    },
    [getItemHeight],
  )

  // Core: compute visible range from scroll position
  const recalc = useCallback(() => {
    const el = containerRef.current
    if (!el) return

    const scrollTop = el.scrollTop
    const viewportHeight = el.clientHeight

    // Find first visible item via accumulated heights
    let accumulated = 0
    let startIdx = 0
    for (let i = 0; i < itemCount; i++) {
      const h = getItemHeight(i)
      if (accumulated + h > scrollTop) {
        startIdx = i
        break
      }
      accumulated += h
      if (i === itemCount - 1) startIdx = itemCount
    }

    // Find last visible item
    let endIdx = startIdx
    let visibleAccum = accumulated - scrollTop // negative portion of first item above viewport
    // Actually recalculate: accumulated is the top of startIdx
    visibleAccum = 0
    for (let i = startIdx; i < itemCount; i++) {
      visibleAccum += getItemHeight(i)
      endIdx = i + 1
      if (accumulated + visibleAccum >= scrollTop + viewportHeight) break
    }

    // Apply overscan
    const start = Math.max(0, startIdx - overscan)
    const end = Math.min(itemCount, endIdx + overscan)

    const newOffsetTop = getOffsetForIndex(start)
    const newTotal = computeTotalHeight()

    setVisibleRange(prev => {
      if (prev.start === start && prev.end === end) return prev
      return { start, end }
    })
    setOffsetTop(newOffsetTop)
    setTotalHeight(newTotal)
  }, [itemCount, getItemHeight, getOffsetForIndex, computeTotalHeight, overscan])

  // Scroll handler with rAF
  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    function onScroll() {
      if (rafId.current) return
      rafId.current = requestAnimationFrame(() => {
        rafId.current = 0
        recalc()
      })
    }

    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('scroll', onScroll)
      if (rafId.current) {
        cancelAnimationFrame(rafId.current)
        rafId.current = 0
      }
    }
  }, [recalc])

  // Recalc when itemCount changes (e.g. items appended without scrolling)
  useEffect(() => {
    const id = requestAnimationFrame(() => recalc())
    return () => cancelAnimationFrame(id)
  }, [itemCount, recalc])

  // measureItem: update height cache and trigger recalc
  const measureItem = useCallback(
    (index: number, height: number) => {
      const prev = heightCache.current.get(index)
      if (prev === height) return
      heightCache.current.set(index, height)
      recalc()
    },
    [recalc],
  )

  // scrollToIndex: scroll so that item at index is at the given block position
  const scrollToIndex = useCallback(
    (index: number, block: 'start' | 'end' = 'start') => {
      const el = containerRef.current
      if (!el) return
      const itemTop = getOffsetForIndex(index)
      if (block === 'start') {
        el.scrollTo(0, itemTop)
      } else {
        const itemHeight = getItemHeight(index)
        el.scrollTo(0, itemTop + itemHeight - el.clientHeight)
      }
    },
    [getOffsetForIndex, getItemHeight],
  )

  return { containerRef, totalHeight, visibleRange, offsetTop, measureItem, scrollToIndex, recalc }
}

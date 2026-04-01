// ② 2026-03-31-selection-overlay-prd.md
import { useRef, useEffect, useState } from 'react'

export interface TrackedRect {
  id: string
  x: number
  y: number
  width: number
  height: number
  kind: 'focus' | 'selection' | 'hover'
}

export interface UseRectTrackerOptions {
  /** Container element ref */
  containerRef: React.RefObject<HTMLElement | null>
  /** Currently focused node ID */
  focusedId: string
  /** Currently selected node IDs */
  selectedIds: string[]
  /** DOM attribute used to identify nodes (e.g. 'data-cms-id') */
  nodeIdAttr?: string
  /** Enable hover tracking (default: true) */
  hover?: boolean
}

const EMPTY: TrackedRect[] = []

function trackElement(
  container: HTMLElement,
  id: string,
  kind: TrackedRect['kind'],
  nodeIdAttr: string,
  cx: number,
  cy: number,
  out: TrackedRect[],
) {
  const el = container.querySelector(`[${nodeIdAttr}="${id}"]`)
  if (!el) return
  const r = el.getBoundingClientRect()
  if (r.width === 0 || r.height === 0) return
  out.push({ id, kind, x: r.left - cx, y: r.top - cy, width: r.width, height: r.height })
}

function rectsEqual(a: TrackedRect[], b: TrackedRect[]): boolean {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const ai = a[i], bi = b[i]
    if (ai.id !== bi.id || ai.kind !== bi.kind ||
        ai.x !== bi.x || ai.y !== bi.y ||
        ai.width !== bi.width || ai.height !== bi.height) return false
  }
  return true
}

/**
 * Tracks bounding rects of focused/selected/hovered nodes via rAF loop.
 * Returns container-relative coordinates for overlay rendering.
 */
export function useRectTracker(options: UseRectTrackerOptions) {
  const { containerRef, focusedId, selectedIds, nodeIdAttr = 'data-node-id', hover = true } = options
  const [rects, setRects] = useState<TrackedRect[]>(EMPTY)
  const hoveredIdRef = useRef<string | null>(null)
  const rafRef = useRef(0)
  const prevRef = useRef<TrackedRect[]>(EMPTY)
  // Store current props in refs so rAF loop doesn't restart on every change
  const focusedIdRef = useRef(focusedId)
  const selectedIdsRef = useRef(selectedIds)
  const nodeIdAttrRef = useRef(nodeIdAttr)

  useEffect(() => {
    focusedIdRef.current = focusedId
    selectedIdsRef.current = selectedIds
    nodeIdAttrRef.current = nodeIdAttr
  })

  // Single stable rAF loop — reads refs, no dependency churn
  useEffect(() => {
    function tick() {
      const container = containerRef?.current
      if (!container) {
        if (prevRef.current.length > 0) {
          prevRef.current = EMPTY
          setRects(EMPTY)
        }
        rafRef.current = requestAnimationFrame(tick)
        return
      }

      const cr = container.getBoundingClientRect()
      const cx = cr.left, cy = cr.top
      const attr = nodeIdAttrRef.current
      const focused = focusedIdRef.current
      const selected = selectedIdsRef.current
      const hovered = hoveredIdRef.current
      const next: TrackedRect[] = []

      if (focused) {
        trackElement(container, focused, 'focus', attr, cx, cy, next)
      }
      for (const id of selected) {
        if (id === focused) continue
        trackElement(container, id, 'selection', attr, cx, cy, next)
      }
      if (hovered && hovered !== focused) {
        trackElement(container, hovered, 'hover', attr, cx, cy, next)
      }

      if (!rectsEqual(prevRef.current, next)) {
        prevRef.current = next
        setRects(next)
      }

      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [containerRef])

  // Hover tracking via mousemove on container
  useEffect(() => {
    const container = containerRef.current
    if (!container || !hover) return

    function handleMouseMove(e: MouseEvent) {
      const target = (e.target as HTMLElement).closest?.(`[${nodeIdAttrRef.current}]`)
      const id = target?.getAttribute(nodeIdAttrRef.current) ?? null
      hoveredIdRef.current = id
    }

    function handleMouseLeave() {
      hoveredIdRef.current = null
    }

    container.addEventListener('mousemove', handleMouseMove)
    container.addEventListener('mouseleave', handleMouseLeave)
    return () => {
      container.removeEventListener('mousemove', handleMouseMove)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [containerRef, hover])

  return rects
}

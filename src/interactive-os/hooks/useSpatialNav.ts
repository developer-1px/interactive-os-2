import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Command, NormalizedData } from '../core/types'
import type { BehaviorContext } from '../behaviors/types'
import { focusCommands } from '../plugins/core'
import { getSpatialParentId } from '../plugins/spatial'
import { getChildren } from '../core/createStore'

type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

function center(r: DOMRect): { x: number; y: number } {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
}

export function findNearest(
  fromId: string,
  dir: Direction,
  rects: Map<string, DOMRect>,
): string | null {
  const fromRect = rects.get(fromId)
  if (!fromRect) return null

  const from = center(fromRect)
  let bestId: string | null = null
  let bestScore = Infinity

  for (const [id, rect] of rects) {
    if (id === fromId) continue
    const c = center(rect)

    // Direction filtering with 1px tolerance
    const inDirection =
      dir === 'ArrowRight' ? c.x > from.x + 1 :
      dir === 'ArrowLeft'  ? c.x < from.x - 1 :
      dir === 'ArrowDown'  ? c.y > from.y + 1 :
      /* ArrowUp */          c.y < from.y - 1

    if (!inDirection) continue

    const dx = Math.abs(c.x - from.x)
    const dy = Math.abs(c.y - from.y)

    // Primary axis + secondary axis * 2 (penalty for misalignment)
    const score =
      (dir === 'ArrowLeft' || dir === 'ArrowRight')
        ? dx + dy * 2
        : dy + dx * 2

    if (score < bestScore) {
      bestScore = score
      bestId = id
    }
  }

  return bestId
}

/**
 * Spatial navigation hook — arrow keys move focus based on DOM position.
 * Only navigates among the direct children of the current __spatial_parent__.
 */
export function useSpatialNav(
  containerSelector: string,
  store: NormalizedData,
  scope?: string,
): Record<string, (ctx: BehaviorContext) => Command | void> {
  const rectsRef = useRef<Map<string, DOMRect>>(new Map())
  const allowedIdsRef = useRef<string[]>([])
  const [, forceUpdate] = useState(0)

  useEffect(() => {
    let rafId = 0
    const handler = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => forceUpdate(n => n + 1))
    }
    window.addEventListener('resize', handler)
    return () => {
      window.removeEventListener('resize', handler)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const spatialParentId = getSpatialParentId(store)
  const allowed = getChildren(store, spatialParentId)
  // eslint-disable-next-line react-hooks/refs
  allowedIdsRef.current = allowed

  useLayoutEffect(() => {
    const container = document.querySelector(containerSelector)
    if (!container) return

    const allowedSet = new Set(allowed)
    const attrName = scope ? `data-${scope}-id` : 'data-node-id'
    const elements = container.querySelectorAll<HTMLElement>(`[${attrName}]`)
    const next = new Map<string, DOMRect>()
    elements.forEach((el) => {
      const id = el.getAttribute(attrName)
      if (id && allowedSet.has(id)) {
        next.set(id, el.getBoundingClientRect())
      }
    })
    rectsRef.current = next
  }, [containerSelector, allowed, scope])

  return useMemo(() => {
    const makeHandler = (dir: Direction) => (ctx: BehaviorContext): Command | void => {
      const targetId = findNearest(ctx.focused, dir, rectsRef.current)
      if (targetId) return focusCommands.setFocus(targetId)
    }

    const makeShiftHandler = (dir: Direction) => (ctx: BehaviorContext): Command | void => {
      const targetId = findNearest(ctx.focused, dir, rectsRef.current)
      if (targetId) return ctx.extendSelectionTo(targetId, allowedIdsRef.current)
    }

    return {
      ArrowUp: makeHandler('ArrowUp'),
      ArrowDown: makeHandler('ArrowDown'),
      ArrowLeft: makeHandler('ArrowLeft'),
      ArrowRight: makeHandler('ArrowRight'),
      'Shift+ArrowUp': makeShiftHandler('ArrowUp'),
      'Shift+ArrowDown': makeShiftHandler('ArrowDown'),
      'Shift+ArrowLeft': makeShiftHandler('ArrowLeft'),
      'Shift+ArrowRight': makeShiftHandler('ArrowRight'),
    }
  }, [allowed])
}

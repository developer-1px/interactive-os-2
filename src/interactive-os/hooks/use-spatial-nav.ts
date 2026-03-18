import { useLayoutEffect, useRef } from 'react'
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
): Record<string, (ctx: BehaviorContext) => Command | void> {
  const rectsRef = useRef<Map<string, DOMRect>>(new Map())

  useLayoutEffect(() => {
    const container = document.querySelector(containerSelector)
    if (!container) return

    // Only collect rects for current depth's children
    const spatialParentId = getSpatialParentId(store)
    const allowedIds = new Set(getChildren(store, spatialParentId))

    const elements = container.querySelectorAll<HTMLElement>('[data-node-id]')
    const next = new Map<string, DOMRect>()
    elements.forEach((el) => {
      const id = el.dataset.nodeId
      if (id && allowedIds.has(id)) {
        next.set(id, el.getBoundingClientRect())
      }
    })
    rectsRef.current = next
  })

  const makeHandler = (dir: Direction) => (ctx: BehaviorContext): Command | void => {
    const targetId = findNearest(ctx.focused, dir, rectsRef.current)
    if (targetId) return focusCommands.setFocus(targetId)
  }

  return {
    ArrowUp: makeHandler('ArrowUp'),
    ArrowDown: makeHandler('ArrowDown'),
    ArrowLeft: makeHandler('ArrowLeft'),
    ArrowRight: makeHandler('ArrowRight'),
  }
}

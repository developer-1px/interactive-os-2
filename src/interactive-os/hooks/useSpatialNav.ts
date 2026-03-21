import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Command, NormalizedData } from '../core/types'
import { ROOT_ID, createBatchCommand } from '../core/types'
import type { BehaviorContext } from '../behaviors/types'
import { focusCommands } from '../plugins/core'
import { getSpatialParentId, spatialCommands } from '../plugins/spatial'
import { getChildren, getParent } from '../core/createStore'

export type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

function center(r: DOMRect): { x: number; y: number } {
  return { x: r.x + r.width / 2, y: r.y + r.height / 2 }
}

/** Shared spatial scoring: find the nearest candidate in a direction from a given rect. */
function findBestInDirection(
  fromRect: DOMRect,
  dir: Direction,
  candidates: Iterable<[string, DOMRect]>,
): string | null {
  const from = center(fromRect)
  let bestId: string | null = null
  let bestScore = Infinity

  for (const [id, rect] of candidates) {
    const c = center(rect)

    const inDirection =
      dir === 'ArrowRight' ? c.x > from.x + 1 :
      dir === 'ArrowLeft'  ? c.x < from.x - 1 :
      dir === 'ArrowDown'  ? c.y > from.y + 1 :
      /* ArrowUp */          c.y < from.y - 1

    if (!inDirection) continue

    const dx = Math.abs(c.x - from.x)
    const dy = Math.abs(c.y - from.y)

    // Secondary axis penalized ×2 to prefer aligned targets
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

export function findNearest(
  fromId: string,
  dir: Direction,
  rects: Map<string, DOMRect>,
): string | null {
  const fromRect = rects.get(fromId)
  if (!fromRect) return null
  const filtered = new Map(rects)
  filtered.delete(fromId)
  return findBestInDirection(fromRect, dir, filtered)
}

export function findAdjacentGroup(
  currentGroupId: string,
  dir: Direction,
  siblingGroupIds: string[],
  groupRects: Map<string, DOMRect>,
): string | null {
  const fromRect = groupRects.get(currentGroupId)
  if (!fromRect) return null
  const candidates: [string, DOMRect][] = []
  for (const id of siblingGroupIds) {
    if (id === currentGroupId) continue
    const rect = groupRects.get(id)
    if (rect) candidates.push([id, rect])
  }
  return findBestInDirection(fromRect, dir, candidates)
}

export interface SpatialNavResult {
  keyMap: Record<string, (ctx: BehaviorContext) => Command | void>
  clearCursorsAtDepth: (parentId: string) => void
}

/**
 * Spatial navigation hook — arrow keys move focus based on DOM position.
 * Only navigates among the direct children of the current __spatial_parent__.
 * Cross-boundary: when findNearest returns null, searches adjacent sibling groups.
 * Sticky cursor: remembers last-focused node per group for reversible traversal.
 */
export function useSpatialNav(
  containerSelector: string,
  store: NormalizedData,
  scope?: string,
): SpatialNavResult {
  const rectsRef = useRef<Map<string, DOMRect>>(new Map())
  const allowedIdsRef = useRef<string[]>([])
  const groupRectsRef = useRef<Map<string, DOMRect>>(new Map())
  const siblingGroupIdsRef = useRef<string[]>([])
  const stickyCursorRef = useRef<Map<string, string>>(new Map())
  const [, forceUpdate] = useState(0)

  // storeRef: makeHandler reads store at keypress time without re-creating keyMap on every store change
  const storeRef = useRef(store)
  storeRef.current = store

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
  const allowedRaw = getChildren(store, spatialParentId)
  // Stabilize reference — only update when the actual children list changes
  const allowedKey = allowedRaw.join(',')
  // eslint-disable-next-line react-hooks/exhaustive-deps -- allowedKey tracks content equality
  const allowed = useMemo(() => allowedRaw, [allowedKey])
  allowedIdsRef.current = allowed

  useLayoutEffect(() => {
    const container = document.querySelector(containerSelector)
    if (!container) return

    const attrName = scope ? `data-${scope}-id` : 'data-node-id'
    const allowedSet = new Set(allowed)
    const elements = container.querySelectorAll<HTMLElement>(`[${attrName}]`)
    const next = new Map<string, DOMRect>()
    elements.forEach((el) => {
      const id = el.getAttribute(attrName)
      if (id && allowedSet.has(id)) {
        next.set(id, el.getBoundingClientRect())
      }
    })
    rectsRef.current = next

    const grandparentId = getParent(store, spatialParentId) ?? ROOT_ID
    const siblingGroups = (grandparentId !== ROOT_ID || spatialParentId !== ROOT_ID)
      ? getChildren(store, grandparentId)
      : []

    const groupNext = new Map<string, DOMRect>()
    for (const gid of siblingGroups) {
      const el = container.querySelector<HTMLElement>(`[${attrName}="${gid}"]`)
      if (el) groupNext.set(gid, el.getBoundingClientRect())
    }
    groupRectsRef.current = groupNext
    siblingGroupIdsRef.current = siblingGroups
  }, [containerSelector, allowed, scope, store, spatialParentId])

  const clearCursorsAtDepth = useCallback((parentId: string) => {
    const s = storeRef.current
    const grandparent = getParent(s, parentId) ?? ROOT_ID
    const siblings = getChildren(s, grandparent)
    for (const sib of siblings) {
      stickyCursorRef.current.delete(sib)
    }
  }, [])

  const keyMap = useMemo(() => {
    const makeHandler = (dir: Direction) => (ctx: BehaviorContext): Command | void => {
      const targetId = findNearest(ctx.focused, dir, rectsRef.current)
      if (targetId) return focusCommands.setFocus(targetId)

      if (spatialParentId === ROOT_ID) return
      const adjacentId = findAdjacentGroup(
        spatialParentId, dir, siblingGroupIdsRef.current, groupRectsRef.current
      )
      if (!adjacentId) return

      // spatialParentId is render-time (pre-transition) value — intentional for "save before leaving"
      stickyCursorRef.current.set(spatialParentId, ctx.focused)

      const sticky = stickyCursorRef.current.get(adjacentId)
      if (sticky && storeRef.current.entities[sticky]) {
        return createBatchCommand([
          spatialCommands.enterChild(adjacentId),
          focusCommands.setFocus(sticky),
        ])
      }

      // On-demand rect collection: DOM reads happen at keypress time, not memoization time
      const adjChildren = getChildren(storeRef.current, adjacentId)
      const container = document.querySelector(containerSelector)
      const attrName = scope ? `data-${scope}-id` : 'data-node-id'
      if (container && adjChildren.length > 0) {
        const adjRects = new Map<string, DOMRect>()
        for (const cid of adjChildren) {
          const el = container.querySelector<HTMLElement>(`[${attrName}="${cid}"]`)
          if (el) adjRects.set(cid, el.getBoundingClientRect())
        }
        // ctx.focused is not in adjRects, so use findBestInDirection with source rect directly
        const fromRect = rectsRef.current.get(ctx.focused)
        const nearestInAdj = fromRect ? findBestInDirection(fromRect, dir, adjRects) : null
        if (nearestInAdj) {
          return createBatchCommand([
            spatialCommands.enterChild(adjacentId),
            focusCommands.setFocus(nearestInAdj),
          ])
        }
      }

      if (adjChildren.length > 0) {
        return createBatchCommand([
          spatialCommands.enterChild(adjacentId),
          focusCommands.setFocus(adjChildren[0]),
        ])
      }
    }

    // Shift+Arrow handlers do NOT get cross-boundary behavior (PRD N1)
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
  // eslint-disable-next-line react-hooks/exhaustive-deps -- allowed triggers handler refresh; refs read at call time
  }, [allowed, spatialParentId, containerSelector, scope])

  return useMemo(() => ({ keyMap, clearCursorsAtDepth }), [keyMap, clearCursorsAtDepth])
}

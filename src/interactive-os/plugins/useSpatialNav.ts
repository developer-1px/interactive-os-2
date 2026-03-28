import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { PatternContext } from '../axis/types'
import { focusCommands } from '../axis/navigate'
import { getSpatialParentId, spatialCommands } from './spatial'
import { getChildren, getParent } from '../store/createStore'

export type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

// Any overlapping candidate beats any non-overlapping one.
// Must exceed the maximum realistic primaryGap + secondaryGap * 2 sum.
const NON_OVERLAP_PENALTY = 100_000

// Weight must be smaller than the minimum meaningful primaryGap unit (1px)
// so center-alignment only breaks ties, never overrides proximity.
const CENTER_TIEBREAK_WEIGHT = 0.001

/**
 * Overlap-based spatial scoring (W3C CSS Spatial Navigation model).
 *
 * 1. Direction filter — candidate center must be in the movement direction.
 * 2. Orthogonal-axis projection overlap — if the two rects overlap when
 *    projected onto the axis perpendicular to movement, the candidate is
 *    "visually aligned" and ranked by primary-axis edge gap alone.
 * 3. Non-overlapping candidates are always scored worse than any overlapping one.
 *    Among non-overlapping candidates, combined primary + secondary gap is used.
 * 4. Center-alignment tiebreak — when primary gap is equal among overlapping
 *    candidates, the one whose center is closer on the secondary axis wins.
 */
function findBestInDirection(
  fromRect: DOMRect,
  dir: Direction,
  candidates: Iterable<[string, DOMRect]>,
  preferredOrtho?: number,
): string | null {
  const isVertical = dir === 'ArrowUp' || dir === 'ArrowDown'
  const fromCenter = isVertical
    ? fromRect.y + fromRect.height / 2
    : fromRect.x + fromRect.width / 2
  // When preferredOrtho is provided, tiebreak uses the remembered coordinate
  // instead of the current element's center (text-editor "preferred column" model)
  const referenceOrtho = preferredOrtho ?? (isVertical
    ? fromRect.x + fromRect.width / 2
    : fromRect.y + fromRect.height / 2)
  let bestId: string | null = null
  let bestScore = Infinity

  for (const [id, rect] of candidates) {
    const candidateCenter = isVertical
      ? rect.y + rect.height / 2
      : rect.x + rect.width / 2

    const inDirection = isVertical
      ? (dir === 'ArrowDown' ? candidateCenter > fromCenter + 1 : candidateCenter < fromCenter - 1)
      : (dir === 'ArrowRight' ? candidateCenter > fromCenter + 1 : candidateCenter < fromCenter - 1)

    if (!inDirection) continue

    const overlap = isVertical
      ? Math.max(0, Math.min(fromRect.right, rect.right) - Math.max(fromRect.left, rect.left))
      : Math.max(0, Math.min(fromRect.bottom, rect.bottom) - Math.max(fromRect.top, rect.top))

    const primaryGap =
      dir === 'ArrowDown'  ? Math.max(0, rect.top - fromRect.bottom) :
      dir === 'ArrowUp'    ? Math.max(0, fromRect.top - rect.bottom) :
      dir === 'ArrowRight' ? Math.max(0, rect.left - fromRect.right) :
      /* ArrowLeft */        Math.max(0, fromRect.left - rect.right)

    let score: number
    if (overlap > 0) {
      const candidateCenterOrtho = isVertical
        ? rect.x + rect.width / 2
        : rect.y + rect.height / 2
      score = primaryGap + Math.abs(candidateCenterOrtho - referenceOrtho) * CENTER_TIEBREAK_WEIGHT
    } else {
      const secondaryGap = isVertical
        ? Math.min(Math.abs(fromRect.right - rect.left), Math.abs(fromRect.left - rect.right))
        : Math.min(Math.abs(fromRect.bottom - rect.top), Math.abs(fromRect.top - rect.bottom))
      score = primaryGap + secondaryGap * 2 + NON_OVERLAP_PENALTY
    }

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
  preferredOrtho?: number,
): string | null {
  const fromRect = rects.get(fromId)
  if (!fromRect) return null
  const filtered = new Map(rects)
  filtered.delete(fromId)
  return findBestInDirection(fromRect, dir, filtered, preferredOrtho)
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
  keyMap: Record<string, (ctx: PatternContext) => Command | void>
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
  // Text-editor "preferred column" model: remembers the orthogonal-axis
  // coordinate from the first move in a consecutive same-axis chain,
  // so wide/tall elements don't erase the user's column/row intent.
  const preferredXRef = useRef<number | null>(null)
  const preferredYRef = useRef<number | null>(null)
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
    preferredXRef.current = null
    preferredYRef.current = null
  }, [])

  const keyMap = useMemo(() => {
    const makeHandler = (dir: Direction) => (ctx: PatternContext): Command | void => {
      const isVert = dir === 'ArrowUp' || dir === 'ArrowDown'
      const fromRect = rectsRef.current.get(ctx.focused)

      // Set preferred on the first move in a chain; reset the orthogonal axis
      if (isVert) {
        if (preferredXRef.current == null && fromRect) {
          preferredXRef.current = fromRect.x + fromRect.width / 2
        }
        preferredYRef.current = null
      } else {
        if (preferredYRef.current == null && fromRect) {
          preferredYRef.current = fromRect.y + fromRect.height / 2
        }
        preferredXRef.current = null
      }

      const preferredOrtho = (isVert ? preferredXRef.current : preferredYRef.current) ?? undefined
      const targetId = findNearest(ctx.focused, dir, rectsRef.current, preferredOrtho)
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
        const nearestInAdj = fromRect ? findBestInDirection(fromRect, dir, adjRects, preferredOrtho) : null
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

    // Shift+Arrow handlers do NOT get cross-boundary pattern (PRD N1)
    const makeShiftHandler = (dir: Direction) => (ctx: PatternContext): Command | void => {
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

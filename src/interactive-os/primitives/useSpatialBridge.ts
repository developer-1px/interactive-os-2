// ② 2026-03-30-spatial-navigate-prd.md
/**
 * Internal spatial bridge — creates a CtxFactory that provides `spatialMove`
 * on PatternContext. Called by useAriaView when spatial strategy is detected.
 *
 * Responsibilities:
 * - Collect DOM rects via selector at keypress time (DOM = source of truth)
 * - Find best candidate in direction (W3C CSS Spatial Nav algorithm)
 * - Maintain preferred orthogonal coordinate (text-editor "remembered column")
 * - Return focusCommands.setFocus(targetId)
 *
 * NOT responsible for: cross-boundary, sticky cursor, groups, depth navigation.
 * Those are consumer-level concerns.
 */
import { useCallback, useEffect, useRef } from 'react'
import type { CtxFactory } from '../axis/types'
import type { Direction } from './spatialAlgorithm'
import { findNearest } from './spatialAlgorithm'
import { focusCommands } from '../axis/navigate'

export function useSpatialBridge(
  selector: string | (() => string) | undefined,
  nodeIdAttr: string,
): CtxFactory | undefined {
  const preferredXRef = useRef<number | null>(null)
  const preferredYRef = useRef<number | null>(null)
  const selectorRef = useRef(selector)
  const attrRef = useRef(nodeIdAttr)

  useEffect(() => {
    selectorRef.current = selector
    attrRef.current = nodeIdAttr
  })


  const factory = useCallback<CtxFactory>((_engine, focusedId) => ({
    spatialMove: (dir: Direction) => {
      const sel = selectorRef.current
      if (!sel) return
      const selectorStr = typeof sel === 'function' ? sel() : sel
      const attr = attrRef.current
      const elements = document.querySelectorAll<HTMLElement>(selectorStr)
      const rects = new Map<string, DOMRect>()
      elements.forEach(el => {
        const id = el.getAttribute(attr)
        if (id) rects.set(id, el.getBoundingClientRect())
      })

      const isVert = dir === 'ArrowUp' || dir === 'ArrowDown'
      const fromRect = rects.get(focusedId)
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
      const targetId = findNearest(focusedId, dir, rects, preferredOrtho)
      if (targetId) return focusCommands.setFocus(targetId)
    },
  }), [])

  return selector ? factory : undefined
}

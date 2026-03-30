// ② 2026-03-30-spatial-navigate-prd.md
/**
 * Pure spatial navigation algorithm — no React, no DOM dependency.
 * Extracted from useSpatialNav for reuse in the OS spatial bridge.
 * W3C CSS Spatial Navigation overlap-based scoring model.
 */

export type Direction = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

// Any overlapping candidate beats any non-overlapping one.
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
 * 4. Center-alignment tiebreak — when primary gap is equal among overlapping
 *    candidates, the one whose center is closer on the secondary axis wins.
 */
export function findBestInDirection(
  fromRect: DOMRect,
  dir: Direction,
  candidates: Iterable<[string, DOMRect]>,
  preferredOrtho?: number,
): string | null {
  const isVertical = dir === 'ArrowUp' || dir === 'ArrowDown'
  const fromCenter = isVertical
    ? fromRect.y + fromRect.height / 2
    : fromRect.x + fromRect.width / 2
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

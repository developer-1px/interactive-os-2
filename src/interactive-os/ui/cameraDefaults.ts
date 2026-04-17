import type { Shot } from './cameraReducer'

export const MIN_SCALE = 0.1
export const MAX_SCALE = 10

export const clampScale = (n: number, lo = MIN_SCALE, hi = MAX_SCALE) =>
  Math.min(Math.max(n, lo), hi)

export function prefersReduceMotion(): boolean {
  if (typeof window === 'undefined' || !window.matchMedia) return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

/**
 * Derive duration from travel distance (viewport center → target center) when
 * the shot doesn't specify one. Linear in distance with a floor + ceiling so
 * small nudges feel snappy and large leaps don't drag on.
 */
export function deriveDurationFromDistance(distancePx: number): number {
  return Math.min(600, Math.max(200, 200 + distancePx * 0.5))
}

export function defaultDuration(
  shot: Pick<Shot, 'duration'>,
  reduce: boolean,
  distancePx: number,
): number {
  if (reduce) return 0
  if (shot.duration != null) return shot.duration
  return deriveDurationFromDistance(distancePx)
}

export function defaultScale(shot: Pick<Shot, 'scale'>): number {
  return shot.scale ?? 1.5
}

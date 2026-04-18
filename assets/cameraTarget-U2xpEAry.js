var e=`import type { RefObject } from 'react'

export interface CameraRect {
  top: number
  left: number
  width: number
  height: number
}

export type CameraTarget =
  | CameraRect
  | string
  | RefObject<HTMLElement | null>

export function isRectTarget(target: CameraTarget): target is CameraRect {
  return typeof target === 'object' && target !== null && 'top' in target && 'width' in target
}

export function resolveElement(target: CameraTarget, container: HTMLElement): Element | null {
  if (typeof target === 'string') return container.querySelector(target)
  if (typeof target === 'object' && 'current' in target) return target.current
  return null
}

export function resolveTarget(
  target: CameraTarget,
  container: HTMLElement,
): CameraRect | null {
  if (isRectTarget(target)) return target
  const el = resolveElement(target, container)
  if (!el) return null
  const cRect = container.getBoundingClientRect()
  const eRect = el.getBoundingClientRect()
  return {
    top: eRect.top - cRect.top + container.scrollTop,
    left: eRect.left - cRect.left + container.scrollLeft,
    width: eRect.width,
    height: eRect.height,
  }
}

/**
 * Compute translate that centers the given rect in container, then applies scale
 * around the rect's center. Uses translate+scale (NOT transform-origin).
 */
export function computeTransformToCenter(
  container: HTMLElement,
  rect: CameraRect,
  scale: number,
): { x: number; y: number } {
  const cr = container.getBoundingClientRect()
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  return {
    x: cr.width / 2 - cx * scale,
    y: cr.height / 2 - cy * scale,
  }
}
`;export{e as default};
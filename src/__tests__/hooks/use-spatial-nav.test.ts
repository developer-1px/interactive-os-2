import { describe, it, expect } from 'vitest'
import { findNearest } from '../../interactive-os/hooks/useSpatialNav'

/**
 * Layout:
 *   [a: 0,0,100,100]     [b: 120,0,100,100]
 *   [c: 0,120,100,100]   [d: 120,120,100,100]
 */
function makeRects(): Map<string, DOMRect> {
  const rect = (x: number, y: number, w: number, h: number) =>
    ({ x, y, width: w, height: h, top: y, left: x, right: x + w, bottom: y + h, toJSON() {} }) as DOMRect
  return new Map([
    ['a', rect(0, 0, 100, 100)],
    ['b', rect(120, 0, 100, 100)],
    ['c', rect(0, 120, 100, 100)],
    ['d', rect(120, 120, 100, 100)],
  ])
}

describe('findNearest', () => {
  const rects = makeRects()

  it('ArrowRight from a → b', () => {
    expect(findNearest('a', 'ArrowRight', rects)).toBe('b')
  })

  it('ArrowDown from a → c', () => {
    expect(findNearest('a', 'ArrowDown', rects)).toBe('c')
  })

  it('ArrowLeft from b → a', () => {
    expect(findNearest('b', 'ArrowLeft', rects)).toBe('a')
  })

  it('ArrowUp from c → a', () => {
    expect(findNearest('c', 'ArrowUp', rects)).toBe('a')
  })

  it('ArrowRight from b → null (nothing to the right)', () => {
    expect(findNearest('b', 'ArrowRight', rects)).toBeNull()
  })

  it('ArrowDown from a prefers c over d (directly below vs diagonal)', () => {
    // c center: (50, 170), d center: (170, 170)
    // from a center: (50, 50)
    // c: dy=120, dx=0 → score = 120 + 0*2 = 120
    // d: dy=120, dx=120 → score = 120 + 120*2 = 360
    expect(findNearest('a', 'ArrowDown', rects)).toBe('c')
  })

  it('returns null when fromId is not in the rects map', () => {
    expect(findNearest('unknown', 'ArrowRight', rects)).toBeNull()
  })

  it('returns null when only one element exists', () => {
    const single = new Map([['a', rects.get('a')!]])
    expect(findNearest('a', 'ArrowRight', single)).toBeNull()
  })
})

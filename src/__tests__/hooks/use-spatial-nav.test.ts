import { describe, it, expect } from 'vitest'
import { findNearest, findAdjacentGroup } from '../../interactive-os/hooks/useSpatialNav'

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

describe('findAdjacentGroup', () => {
  // Layout:
  //   sec1: [0,0,300,200]     children: a[0,0,100,100], b[120,0,100,100]
  //   sec2: [0,220,300,200]   children: c[0,220,100,100], d[120,220,100,100]
  const rect = (x: number, y: number, w: number, h: number) =>
    ({ x, y, width: w, height: h, top: y, left: x, right: x + w, bottom: y + h, toJSON() {} }) as DOMRect

  const groupRects = new Map([
    ['sec1', rect(0, 0, 300, 200)],
    ['sec2', rect(0, 220, 300, 200)],
  ])
  const siblings = ['sec1', 'sec2']

  it('ArrowDown from sec1 → sec2', () => {
    expect(findAdjacentGroup('sec1', 'ArrowDown', siblings, groupRects)).toBe('sec2')
  })

  it('ArrowUp from sec2 → sec1', () => {
    expect(findAdjacentGroup('sec2', 'ArrowUp', siblings, groupRects)).toBe('sec1')
  })

  it('ArrowDown from sec2 → null (no group below)', () => {
    expect(findAdjacentGroup('sec2', 'ArrowDown', siblings, groupRects)).toBeNull()
  })

  it('ArrowRight from sec1 → null (no group to the right)', () => {
    expect(findAdjacentGroup('sec1', 'ArrowRight', siblings, groupRects)).toBeNull()
  })
})

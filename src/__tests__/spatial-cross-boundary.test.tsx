/**
 * Integration test: cross-boundary spatial nav + sticky cursor
 *
 * Tests PRD scenarios T1-T13 + N2 for spatial navigation that crosses
 * group boundaries with sticky cursor for reversible traversal.
 *
 * Key challenge: jsdom returns all-zeros for getBoundingClientRect().
 * Solution: stub Element.prototype.getBoundingClientRect with a rectMap
 * keyed by data-cms-id attribute values.
 */
import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useCallback, useMemo } from 'react'
import { useEngine } from '../interactive-os/hooks/useEngine'
import { useAriaZone } from '../interactive-os/hooks/useAriaZone'
import { useSpatialNav } from '../interactive-os/hooks/useSpatialNav'
import { spatial } from '../interactive-os/behaviors/spatial'
import { spatialCommands } from '../interactive-os/plugins/spatial'
import { focusCommands } from '../interactive-os/plugins/core'
import { spatialReachable } from '../interactive-os/plugins/focusRecovery'
import { createStore, getParent } from '../interactive-os/core/createStore'
import { ROOT_ID, createBatchCommand } from '../interactive-os/core/types'
import type { NormalizedData } from '../interactive-os/core/types'
import type { BehaviorContext } from '../interactive-os/behaviors/types'

// ── rect helper ──

function rect(x: number, y: number, w: number, h: number): DOMRect {
  return {
    x, y, width: w, height: h,
    top: y, left: x, right: x + w, bottom: y + h,
    toJSON() {},
  } as DOMRect
}

// ── Fixture stores ──

function flatFixture(): NormalizedData {
  return createStore({
    entities: {
      sec1: { id: 'sec1', data: { label: 'Section 1' } },
      sec2: { id: 'sec2', data: { label: 'Section 2' } },
      sec3: { id: 'sec3', data: { label: 'Section 3' } },
      a: { id: 'a', data: { label: 'A' } },
      b: { id: 'b', data: { label: 'B' } },
      c: { id: 'c', data: { label: 'C' } },
      d: { id: 'd', data: { label: 'D' } },
      e: { id: 'e', data: { label: 'E' } },
      f: { id: 'f', data: { label: 'F' } },
    },
    relationships: {
      [ROOT_ID]: ['sec1', 'sec2', 'sec3'],
      sec1: ['a', 'b'],
      sec2: ['c', 'd'],
      sec3: ['e', 'f'],
    },
  })
}

/**
 * Nested fixture for depth-2 tests (T12, T13):
 * ROOT → [sec1]
 *   sec1 → [card1, card2]
 *     card1 → [x, y]
 *     card2 → [z, w]
 */
function nestedFixture(): NormalizedData {
  return createStore({
    entities: {
      sec1: { id: 'sec1', data: { label: 'Section 1' } },
      card1: { id: 'card1', data: { label: 'Card 1' } },
      card2: { id: 'card2', data: { label: 'Card 2' } },
      x: { id: 'x', data: { label: 'X' } },
      y: { id: 'y', data: { label: 'Y' } },
      z: { id: 'z', data: { label: 'Z' } },
      w: { id: 'w', data: { label: 'W' } },
    },
    relationships: {
      [ROOT_ID]: ['sec1'],
      sec1: ['card1', 'card2'],
      card1: ['x', 'y'],
      card2: ['z', 'w'],
    },
  })
}

// ── Rect maps ──

const flatRectMap: Record<string, DOMRect> = {
  // Sections stacked vertically
  sec1: rect(0, 0, 400, 200),
  sec2: rect(0, 220, 400, 200),
  sec3: rect(0, 440, 400, 200),
  // sec1 children side by side
  a: rect(10, 10, 180, 180),
  b: rect(210, 10, 180, 180),
  // sec2 children side by side
  c: rect(10, 230, 180, 180),
  d: rect(210, 230, 180, 180),
  // sec3 children side by side
  e: rect(10, 450, 180, 180),
  f: rect(210, 450, 180, 180),
}

const nestedRectMap: Record<string, DOMRect> = {
  sec1: rect(0, 0, 400, 400),
  // card1 and card2 stacked vertically inside sec1
  card1: rect(10, 10, 380, 180),
  card2: rect(10, 210, 380, 180),
  // card1 children
  x: rect(20, 20, 170, 160),
  y: rect(200, 20, 170, 160),
  // card2 children
  z: rect(20, 220, 170, 160),
  w: rect(200, 220, 170, 160),
}

// ── Minimal test component (mirrors CmsCanvas hook setup) ──

function TestCanvas({ data, activeRectMap }: { data: NormalizedData; activeRectMap: Record<string, DOMRect> }) {
  const { engine, store } = useEngine({ data })
  const spatialNav = useSpatialNav('[data-test-root]', store, 'test')

  const testKeyMap = useMemo(() => ({
    ...spatialNav.keyMap,
    Enter: (ctx: BehaviorContext) => {
      const children = ctx.getChildren(ctx.focused)
      if (children.length === 0) return
      spatialNav.clearCursorsAtDepth(ctx.focused)
      return createBatchCommand([
        spatialCommands.enterChild(ctx.focused),
        focusCommands.setFocus(children[0]),
      ])
    },
    Escape: (ctx: BehaviorContext) => {
      const spatialParent = ctx.getEntity('__spatial_parent__')
      const parentId = spatialParent?.parentId as string | undefined
      if (!parentId || parentId === ROOT_ID) return undefined
      spatialNav.clearCursorsAtDepth(parentId)
      return createBatchCommand([
        spatialCommands.exitToParent(),
        focusCommands.setFocus(parentId),
      ])
    },
  }), [spatialNav])

  const aria = useAriaZone({
    engine,
    store,
    behavior: spatial,
    scope: 'test',
    keyMap: testKeyMap,
    isReachable: spatialReachable,
  })

  const currentStore = aria.getStore()

  const handleNodeClick = useCallback((nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const s = aria.getStore()
    const parentId = getParent(s, nodeId) ?? ROOT_ID
    spatialNav.clearCursorsAtDepth(parentId)
    aria.dispatch(focusCommands.setFocus(nodeId))
  }, [aria, spatialNav])

  // Collect all entity IDs to render flat
  const allIds = Object.keys(currentStore.entities).filter(
    id => !id.startsWith('__') && activeRectMap[id]
  )

  return (
    <div data-test-root data-aria-container="">
      {allIds.map(id => {
        const props = aria.getNodeProps(id)
        const { onClick: _, ...restProps } = props as Record<string, unknown>
        void _
        return (
          <div
            key={id}
            {...(restProps as React.HTMLAttributes<HTMLDivElement>)}
            onClick={(e) => handleNodeClick(id, e)}
          >
            {(currentStore.entities[id]?.data as Record<string, string>)?.label ?? id}
          </div>
        )
      })}
    </div>
  )
}

// ── Test helpers ──

function getFocused(container: HTMLElement): string {
  return container.querySelector('[tabindex="0"][data-test-id]')?.getAttribute('data-test-id') ?? ''
}

let rectStub: ReturnType<typeof vi.spyOn> | null = null

function stubRects(rectMap: Record<string, DOMRect>) {
  rectStub = vi.spyOn(Element.prototype, 'getBoundingClientRect').mockImplementation(function (this: Element) {
    const id = this.getAttribute('data-test-id')
    if (id && rectMap[id]) return rectMap[id]
    return new DOMRect(0, 0, 0, 0)
  })
}

function setup(fixtureData?: NormalizedData, rectMap?: Record<string, DOMRect>) {
  const data = fixtureData ?? flatFixture()
  const rects = rectMap ?? flatRectMap
  stubRects(rects)
  const user = userEvent.setup()
  const result = render(<TestCanvas data={data} activeRectMap={rects} />)
  return { user, container: result.container as HTMLElement }
}

// ── Tests ──

describe('spatial cross-boundary + sticky cursor', () => {
  afterEach(() => {
    rectStub?.mockRestore()
    rectStub = null
  })

  // T9: intra-group arrow nav unchanged
  it('T9: intra-group ArrowRight moves within same group', async () => {
    const { user, container } = setup()
    // Enter sec1 to go to depth 1
    const sec1 = container.querySelector('[data-test-id="sec1"]') as HTMLElement
    act(() => { sec1.focus() })
    await user.keyboard('{Enter}')
    expect(getFocused(container)).toBe('a')
    await user.keyboard('{ArrowRight}')
    expect(getFocused(container)).toBe('b')
  })

  // T1: ↓ at group boundary crosses to adjacent group
  it('T1: ArrowDown at group boundary crosses to adjacent group', async () => {
    const { user, container } = setup()
    // Enter sec1
    const sec1 = container.querySelector('[data-test-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container)).toBe('a')
    await user.keyboard('{ArrowRight}')
    expect(getFocused(container)).toBe('b')
    // ArrowDown from b(300,100) — nearest in sec2 is d(300,320) (aligned horizontally)
    await user.keyboard('{ArrowDown}')
    expect(getFocused(container)).toBe('d')
  })

  // T2: ↑ after cross-boundary restores sticky cursor
  it('T2: ArrowUp after cross-boundary restores sticky cursor', async () => {
    const { user, container } = setup()
    const sec1 = container.querySelector('[data-test-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{Enter}')
    // Navigate to b
    await user.keyboard('{ArrowRight}')
    expect(getFocused(container)).toBe('b')
    // Cross to sec2 — lands on d (nearest to b)
    await user.keyboard('{ArrowDown}')
    expect(getFocused(container)).toBe('d')
    // Go back up — sticky cursor should restore to b
    await user.keyboard('{ArrowUp}')
    expect(getFocused(container)).toBe('b')
  })

  // T3: consecutive ↓ crosses multiple groups
  it('T3: consecutive ArrowDown crosses multiple groups', async () => {
    const { user, container } = setup()
    const sec1 = container.querySelector('[data-test-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container)).toBe('a')
    // a(100,100) ↓ → c(100,320) in sec2 (aligned)
    await user.keyboard('{ArrowDown}')
    expect(getFocused(container)).toBe('c')
    // c(100,320) ↓ → e(100,540) in sec3 (aligned)
    await user.keyboard('{ArrowDown}')
    expect(getFocused(container)).toBe('e')
  })

  // T4: ↓ at last group does nothing
  it('T4: ArrowDown at last group does nothing', async () => {
    const { user, container } = setup()
    const sec1 = container.querySelector('[data-test-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{Enter}')
    // Navigate to sec3: cross sec1 → sec2 → sec3
    await user.keyboard('{ArrowDown}')
    await user.keyboard('{ArrowDown}')
    // a(100,100) → c(100,320) → e(100,540)
    expect(getFocused(container)).toBe('e')
    // ArrowDown at sec3 — no adjacent group below
    await user.keyboard('{ArrowDown}')
    expect(getFocused(container)).toBe('e')
  })

  // T6: Escape clears sticky cursors at that depth
  it('T6: Escape clears sticky cursors at that depth', async () => {
    const { user, container } = setup()
    const sec1 = container.querySelector('[data-test-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{Enter}') // Enter sec1 → a
    expect(getFocused(container)).toBe('a')
    await user.keyboard('{ArrowRight}') // → b
    expect(getFocused(container)).toBe('b')
    await user.keyboard('{ArrowDown}') // b→d in sec2 (sticky: sec1→b)
    expect(getFocused(container)).toBe('d')
    await user.keyboard('{Escape}') // back to depth 0, clears sticky cursors
    // Now at depth 0, focused on sec2 (spatial parent was sec2)
    // Re-enter: focus sec1 and Enter
    const sec1Again = container.querySelector('[data-test-id="sec1"]') as HTMLElement
    act(() => { sec1Again.focus() })
    await user.keyboard('{Enter}')
    // Sticky was cleared, so first child (a), not b
    expect(getFocused(container)).toBe('a')
  })

  // T10: ROOT depth 0 boundary does nothing
  it('T10: ArrowDown at ROOT depth 0 boundary does nothing', async () => {
    const { user, container } = setup()
    // At depth 0, focus sec3
    const sec3 = container.querySelector('[data-test-id="sec3"]') as HTMLElement
    sec3.focus()
    await user.keyboard('{ArrowDown}')
    // At ROOT level, cross-boundary is disabled
    expect(getFocused(container)).toBe('sec3')
  })

  // T11: Shift+Arrow does not cross boundary
  it('T11: Shift+ArrowDown does not cross boundary', async () => {
    const { user, container } = setup()
    const sec1 = container.querySelector('[data-test-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{ArrowRight}')
    expect(getFocused(container)).toBe('b')
    await user.keyboard('{Shift>}{ArrowDown}{/Shift}')
    // Should stay at b — Shift+Arrow doesn't cross boundary
    expect(getFocused(container)).toBe('b')
  })

  // N2: Home/End does not cross boundary
  it('N2: Home/End does not cross boundary', async () => {
    const { user, container } = setup()
    const sec1 = container.querySelector('[data-test-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{ArrowRight}')
    expect(getFocused(container)).toBe('b')
    await user.keyboard('{End}')
    expect(getFocused(container)).toBe('b') // b is last in sec1
    await user.keyboard('{Home}')
    expect(getFocused(container)).toBe('a') // a is first in sec1
  })

  // T7: click within same group resets sticky cursor for sibling groups
  it('T7: click resets sticky cursor', async () => {
    const { user, container } = setup()
    const sec1 = container.querySelector('[data-test-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{Enter}') // sec1 → a
    await user.keyboard('{ArrowRight}') // → b
    expect(getFocused(container)).toBe('b')
    // Cross to sec2 → d (nearest to b). sticky: {sec1: b}
    await user.keyboard('{ArrowDown}')
    expect(getFocused(container)).toBe('d')
    // Move to c within sec2
    await user.keyboard('{ArrowLeft}')
    expect(getFocused(container)).toBe('c')
    // Click on d (same group sec2) — clearCursorsAtDepth clears ROOT siblings = sec1, sec2, sec3
    const nodeD = container.querySelector('[data-test-id="d"]') as HTMLElement
    await user.click(nodeD)
    expect(getFocused(container)).toBe('d')
    // Cross back to sec1 — sticky for sec1 was 'b' but click cleared it
    // From d(300,320) ↑ → nearest in sec1: b(300,100) aligned, BUT no sticky
    // findBestInDirection from d → b (same x). This is same as sticky result.
    // So instead, cross from c perspective: go back to c first, then up
    await user.keyboard('{ArrowLeft}') // → c
    await user.keyboard('{ArrowUp}')   // cross to sec1, no sticky → nearest from c(100,320) = a(100,100)
    expect(getFocused(container)).toBe('a') // without sticky, nearest to c is a (not b)
  })

  // T12: depth 2 cross-boundary between sibling containers
  it('T12: depth 2 cross-boundary between sibling containers', async () => {
    const { user, container } = setup(nestedFixture(), nestedRectMap)
    // Enter sec1 → card1 (first child)
    const sec1 = container.querySelector('[data-test-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container)).toBe('card1')
    // Enter card1 → x (first child)
    await user.keyboard('{Enter}')
    expect(getFocused(container)).toBe('x')
    // x(105,100) ↓ → z(105,300) in card2 (aligned)
    await user.keyboard('{ArrowDown}')
    expect(getFocused(container)).toBe('z')
  })

  // T13: depth 2 sticky cursor restore
  it('T13: depth 2 sticky cursor restore', async () => {
    const { user, container } = setup(nestedFixture(), nestedRectMap)
    const sec1 = container.querySelector('[data-test-id="sec1"]') as HTMLElement
    sec1.focus()
    await user.keyboard('{Enter}')
    await user.keyboard('{Enter}') // now in card1, focused on x
    expect(getFocused(container)).toBe('x')
    await user.keyboard('{ArrowRight}') // → y
    expect(getFocused(container)).toBe('y')
    // y(285,100) ↓ → w(285,300) in card2 (aligned), sticky: card1→y
    await user.keyboard('{ArrowDown}')
    expect(getFocused(container)).toBe('w')
    await user.keyboard('{ArrowUp}') // back to card1, sticky → y
    expect(getFocused(container)).toBe('y')
  })
})

import { describe, it, expect, vi } from 'vitest'
import { spatial } from '../../interactive-os/behaviors/spatial'
import type { BehaviorContext } from '../../interactive-os/behaviors/types'
import type { Entity } from '../../interactive-os/core/types'
import { SPATIAL_PARENT_ID } from '../../interactive-os/plugins/spatial'

function createMockCtx(overrides: Partial<BehaviorContext> = {}): BehaviorContext {
  return {
    focused: 'node-1',
    selected: [],
    isExpanded: false,
    focusNext: vi.fn(),
    focusPrev: vi.fn(),
    focusFirst: vi.fn(),
    focusLast: vi.fn(),
    focusParent: vi.fn(),
    focusChild: vi.fn(),
    expand: vi.fn(),
    collapse: vi.fn(),
    activate: vi.fn(),
    toggleSelect: vi.fn(),
    extendSelection: vi.fn(),
    dispatch: vi.fn(),
    getEntity: vi.fn(() => undefined),
    getChildren: vi.fn(() => []),
    ...overrides,
  }
}

describe('spatial behavior', () => {
  it('has role "group" and childRole "group"', () => {
    expect(spatial.role).toBe('group')
    expect(spatial.childRole).toBe('group')
  })

  it('uses roving-tabindex with "both" orientation', () => {
    expect(spatial.focusStrategy).toEqual({
      type: 'roving-tabindex',
      orientation: 'both',
    })
  })

  it('has Enter, Escape, F2 in keyMap', () => {
    expect(spatial.keyMap).toHaveProperty('Enter')
    expect(spatial.keyMap).toHaveProperty('Escape')
    expect(spatial.keyMap).toHaveProperty('F2')
    expect(typeof spatial.keyMap.Enter).toBe('function')
    expect(typeof spatial.keyMap.Escape).toBe('function')
    expect(typeof spatial.keyMap.F2).toBe('function')
  })

  it('ariaAttributes returns aria-level from state', () => {
    const node: Entity = { id: 'test' }
    const state = {
      focused: false,
      selected: false,
      disabled: false,
      index: 0,
      siblingCount: 1,
      level: 3,
    }
    const attrs = spatial.ariaAttributes(node, state)
    expect(attrs).toEqual({ 'aria-level': '3' })
  })

  it('ariaAttributes defaults aria-level to 1 when level is undefined', () => {
    const node: Entity = { id: 'test' }
    const state = {
      focused: false,
      selected: false,
      disabled: false,
      index: 0,
      siblingCount: 1,
    }
    const attrs = spatial.ariaAttributes(node, state)
    expect(attrs).toEqual({ 'aria-level': '1' })
  })

  it('Enter on container node produces batch command with enterChild + setFocus', () => {
    const ctx = createMockCtx({
      focused: 'parent-1',
      getChildren: vi.fn(() => ['child-a', 'child-b']),
    })
    const cmd = spatial.keyMap.Enter(ctx)
    expect(cmd).toBeDefined()
    expect(cmd!.type).toBe('batch')
  })

  it('Enter on leaf node produces startRename command', () => {
    const ctx = createMockCtx({
      focused: 'leaf-1',
      getChildren: vi.fn(() => []),
    })
    const cmd = spatial.keyMap.Enter(ctx)
    expect(cmd).toBeDefined()
    expect(cmd!.type).toBe('rename:start')
  })

  it('Escape when spatial parent exists produces batch command', () => {
    const ctx = createMockCtx({
      getEntity: vi.fn((id: string) => {
        if (id === SPATIAL_PARENT_ID) {
          return { id: SPATIAL_PARENT_ID, parentId: 'some-parent' }
        }
        return undefined
      }),
    })
    const cmd = spatial.keyMap.Escape(ctx)
    expect(cmd).toBeDefined()
    expect(cmd!.type).toBe('batch')
  })

  it('Escape at root level is no-op', () => {
    const ctx = createMockCtx({
      getEntity: vi.fn(() => undefined),
    })
    const cmd = spatial.keyMap.Escape(ctx)
    expect(cmd).toBeUndefined()
  })

  it('F2 produces startRename command', () => {
    const ctx = createMockCtx({ focused: 'any-node' })
    const cmd = spatial.keyMap.F2(ctx)
    expect(cmd).toBeDefined()
    expect(cmd!.type).toBe('rename:start')
  })

  it('activateOnClick is true', () => {
    expect(spatial.activateOnClick).toBe(true)
  })
})

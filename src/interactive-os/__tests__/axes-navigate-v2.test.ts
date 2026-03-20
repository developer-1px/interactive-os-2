import { describe, it, expect, vi } from 'vitest'
import { navigate } from '../axes/navigate'
import type { BehaviorContext } from '../behaviors/types'
import type { Command } from '../core/types'

function makeCmd(type: string): Command {
  return {
    type,
    payload: null,
    execute: (s) => s,
    undo: (s) => s,
  }
}

function makeMockCtx(overrides?: Partial<BehaviorContext>): BehaviorContext {
  return {
    focused: 'node-1',
    selected: [],
    isExpanded: false,
    focusNext: vi.fn((opts?) => makeCmd(opts?.wrap ? 'focusNext:wrap' : 'focusNext')),
    focusPrev: vi.fn((opts?) => makeCmd(opts?.wrap ? 'focusPrev:wrap' : 'focusPrev')),
    focusFirst: vi.fn(() => makeCmd('focusFirst')),
    focusLast: vi.fn(() => makeCmd('focusLast')),
    focusParent: vi.fn(() => makeCmd('focusParent')),
    focusChild: vi.fn(() => makeCmd('focusChild')),
    expand: vi.fn(() => makeCmd('expand')),
    collapse: vi.fn(() => makeCmd('collapse')),
    activate: vi.fn(() => makeCmd('activate')),
    toggleSelect: vi.fn(() => makeCmd('toggleSelect')),
    extendSelection: vi.fn((dir) => makeCmd(`extendSelection:${dir}`)),
    extendSelectionTo: vi.fn((id) => makeCmd(`extendSelectionTo:${id}`)),
    dispatch: vi.fn(),
    getEntity: vi.fn(() => undefined),
    getChildren: vi.fn(() => []),
    ...overrides,
  }
}

function makeGridCtx(): BehaviorContext {
  return makeMockCtx({
    grid: {
      colIndex: 0,
      colCount: 3,
      focusNextCol: vi.fn(() => makeCmd('focusNextCol')),
      focusPrevCol: vi.fn(() => makeCmd('focusPrevCol')),
      focusFirstCol: vi.fn(() => makeCmd('focusFirstCol')),
      focusLastCol: vi.fn(() => makeCmd('focusLastCol')),
    },
  })
}

describe('navigate() — vertical (default)', () => {
  it('binds ArrowDown, ArrowUp, Home, End', () => {
    const axis = navigate()
    expect(axis.keyMap).toHaveProperty('ArrowDown')
    expect(axis.keyMap).toHaveProperty('ArrowUp')
    expect(axis.keyMap).toHaveProperty('Home')
    expect(axis.keyMap).toHaveProperty('End')
  })

  it('does not bind ArrowLeft or ArrowRight', () => {
    const axis = navigate()
    expect(axis.keyMap).not.toHaveProperty('ArrowLeft')
    expect(axis.keyMap).not.toHaveProperty('ArrowRight')
  })

  it('ArrowDown calls focusNext()', () => {
    const ctx = makeMockCtx()
    const axis = navigate()
    const result = axis.keyMap['ArrowDown'](ctx)
    expect(ctx.focusNext).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusNext' })
  })

  it('ArrowUp calls focusPrev()', () => {
    const ctx = makeMockCtx()
    const axis = navigate()
    const result = axis.keyMap['ArrowUp'](ctx)
    expect(ctx.focusPrev).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusPrev' })
  })

  it('config has focusStrategy roving-tabindex with orientation vertical', () => {
    const axis = navigate()
    expect(axis.config?.focusStrategy).toEqual({
      type: 'roving-tabindex',
      orientation: 'vertical',
    })
  })
})

describe('navigate() — default orientation is vertical', () => {
  it('does not bind horizontal arrows when called with no options', () => {
    const axis = navigate()
    expect(axis.keyMap).not.toHaveProperty('ArrowLeft')
    expect(axis.keyMap).not.toHaveProperty('ArrowRight')
  })
})

describe('navigate({ orientation: "horizontal" })', () => {
  it('binds ArrowRight, ArrowLeft, Home, End', () => {
    const axis = navigate({ orientation: 'horizontal' })
    expect(axis.keyMap).toHaveProperty('ArrowRight')
    expect(axis.keyMap).toHaveProperty('ArrowLeft')
    expect(axis.keyMap).toHaveProperty('Home')
    expect(axis.keyMap).toHaveProperty('End')
  })

  it('does not bind ArrowDown or ArrowUp', () => {
    const axis = navigate({ orientation: 'horizontal' })
    expect(axis.keyMap).not.toHaveProperty('ArrowDown')
    expect(axis.keyMap).not.toHaveProperty('ArrowUp')
  })

  it('config has focusStrategy roving-tabindex with orientation horizontal', () => {
    const axis = navigate({ orientation: 'horizontal' })
    expect(axis.config?.focusStrategy).toEqual({
      type: 'roving-tabindex',
      orientation: 'horizontal',
    })
  })
})

describe('navigate({ orientation: "both" })', () => {
  it('binds all 4 arrows', () => {
    const axis = navigate({ orientation: 'both' })
    expect(axis.keyMap).toHaveProperty('ArrowDown')
    expect(axis.keyMap).toHaveProperty('ArrowUp')
    expect(axis.keyMap).toHaveProperty('ArrowRight')
    expect(axis.keyMap).toHaveProperty('ArrowLeft')
  })

  it('does not bind Home or End', () => {
    const axis = navigate({ orientation: 'both' })
    expect(axis.keyMap).not.toHaveProperty('Home')
    expect(axis.keyMap).not.toHaveProperty('End')
  })
})

describe('navigate({ wrap: true })', () => {
  it('passes { wrap: true } to focusNext on ArrowDown', () => {
    const ctx = makeMockCtx()
    const axis = navigate({ wrap: true })
    axis.keyMap['ArrowDown'](ctx)
    expect(ctx.focusNext).toHaveBeenCalledWith({ wrap: true })
  })

  it('passes { wrap: true } to focusPrev on ArrowUp', () => {
    const ctx = makeMockCtx()
    const axis = navigate({ wrap: true })
    axis.keyMap['ArrowUp'](ctx)
    expect(ctx.focusPrev).toHaveBeenCalledWith({ wrap: true })
  })

  it('passes { wrap: true } to focusNext on ArrowRight (horizontal)', () => {
    const ctx = makeMockCtx()
    const axis = navigate({ orientation: 'horizontal', wrap: true })
    axis.keyMap['ArrowRight'](ctx)
    expect(ctx.focusNext).toHaveBeenCalledWith({ wrap: true })
  })

  it('passes { wrap: true } to focusPrev on ArrowLeft (horizontal)', () => {
    const ctx = makeMockCtx()
    const axis = navigate({ orientation: 'horizontal', wrap: true })
    axis.keyMap['ArrowLeft'](ctx)
    expect(ctx.focusPrev).toHaveBeenCalledWith({ wrap: true })
  })
})

describe('navigate({ grid: { columns: N } })', () => {
  it('binds 8 keys including Mod+Home and Mod+End', () => {
    const axis = navigate({ grid: { columns: 3 } })
    expect(axis.keyMap).toHaveProperty('ArrowDown')
    expect(axis.keyMap).toHaveProperty('ArrowUp')
    expect(axis.keyMap).toHaveProperty('ArrowRight')
    expect(axis.keyMap).toHaveProperty('ArrowLeft')
    expect(axis.keyMap).toHaveProperty('Home')
    expect(axis.keyMap).toHaveProperty('End')
    expect(axis.keyMap).toHaveProperty('Mod+Home')
    expect(axis.keyMap).toHaveProperty('Mod+End')
  })

  it('sets colCount in config', () => {
    const axis = navigate({ grid: { columns: 4 } })
    expect(axis.config?.colCount).toBe(4)
  })

  it('ArrowRight uses grid.focusNextCol() when grid is available', () => {
    const ctx = makeGridCtx()
    const axis = navigate({ grid: { columns: 3 } })
    const result = axis.keyMap['ArrowRight'](ctx)
    expect(ctx.grid!.focusNextCol).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusNextCol' })
  })

  it('ArrowRight falls back to focusNext() when grid is absent', () => {
    const ctx = makeMockCtx()
    const axis = navigate({ grid: { columns: 3 } })
    const result = axis.keyMap['ArrowRight'](ctx)
    expect(ctx.focusNext).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusNext' })
  })

  it('config orientation is "both" (not "vertical")', () => {
    const axis = navigate({ grid: { columns: 3 } })
    expect(axis.config?.focusStrategy?.orientation).toBe('both')
  })

  it('Mod+Home calls focusFirst()', () => {
    const ctx = makeGridCtx()
    const axis = navigate({ grid: { columns: 3 } })
    const result = axis.keyMap['Mod+Home'](ctx)
    expect(ctx.focusFirst).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusFirst' })
  })

  it('Mod+End calls focusLast()', () => {
    const ctx = makeGridCtx()
    const axis = navigate({ grid: { columns: 3 } })
    const result = axis.keyMap['Mod+End'](ctx)
    expect(ctx.focusLast).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusLast' })
  })
})

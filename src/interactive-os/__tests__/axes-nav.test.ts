import { describe, it, expect, vi } from 'vitest'
import { navV } from '../axes/nav-v'
import { navH } from '../axes/nav-h'
import { navVhUniform } from '../axes/nav-vh-uniform'
import { navGrid } from '../axes/nav-grid'
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

describe('navV', () => {
  it('defines ArrowDown, ArrowUp, Home, End', () => {
    expect(navV).toHaveProperty('ArrowDown')
    expect(navV).toHaveProperty('ArrowUp')
    expect(navV).toHaveProperty('Home')
    expect(navV).toHaveProperty('End')
  })

  it('ArrowDown calls focusNext()', () => {
    const ctx = makeMockCtx()
    const result = navV['ArrowDown'](ctx)
    expect(ctx.focusNext).toHaveBeenCalledWith()
    expect(result).toMatchObject({ type: 'focusNext' })
  })

  it('ArrowUp calls focusPrev()', () => {
    const ctx = makeMockCtx()
    const result = navV['ArrowUp'](ctx)
    expect(ctx.focusPrev).toHaveBeenCalledWith()
    expect(result).toMatchObject({ type: 'focusPrev' })
  })

  it('Home calls focusFirst()', () => {
    const ctx = makeMockCtx()
    const result = navV['Home'](ctx)
    expect(ctx.focusFirst).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusFirst' })
  })

  it('End calls focusLast()', () => {
    const ctx = makeMockCtx()
    const result = navV['End'](ctx)
    expect(ctx.focusLast).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusLast' })
  })
})

describe('navH', () => {
  it('defines ArrowRight, ArrowLeft, Home, End', () => {
    const axis = navH()
    expect(axis).toHaveProperty('ArrowRight')
    expect(axis).toHaveProperty('ArrowLeft')
    expect(axis).toHaveProperty('Home')
    expect(axis).toHaveProperty('End')
  })

  it('ArrowRight calls focusNext() without wrap by default', () => {
    const ctx = makeMockCtx()
    const axis = navH()
    const result = axis['ArrowRight'](ctx)
    expect(ctx.focusNext).toHaveBeenCalledWith(undefined)
    expect(result).toMatchObject({ type: 'focusNext' })
  })

  it('ArrowLeft calls focusPrev() without wrap by default', () => {
    const ctx = makeMockCtx()
    const axis = navH()
    const result = axis['ArrowLeft'](ctx)
    expect(ctx.focusPrev).toHaveBeenCalledWith(undefined)
    expect(result).toMatchObject({ type: 'focusPrev' })
  })

  it('ArrowRight calls focusNext({ wrap: true }) when wrap option is set', () => {
    const ctx = makeMockCtx()
    const axis = navH({ wrap: true })
    const result = axis['ArrowRight'](ctx)
    expect(ctx.focusNext).toHaveBeenCalledWith({ wrap: true })
    expect(result).toMatchObject({ type: 'focusNext:wrap' })
  })

  it('ArrowLeft calls focusPrev({ wrap: true }) when wrap option is set', () => {
    const ctx = makeMockCtx()
    const axis = navH({ wrap: true })
    const result = axis['ArrowLeft'](ctx)
    expect(ctx.focusPrev).toHaveBeenCalledWith({ wrap: true })
    expect(result).toMatchObject({ type: 'focusPrev:wrap' })
  })

  it('Home calls focusFirst()', () => {
    const ctx = makeMockCtx()
    const axis = navH()
    const result = axis['Home'](ctx)
    expect(ctx.focusFirst).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusFirst' })
  })

  it('End calls focusLast()', () => {
    const ctx = makeMockCtx()
    const axis = navH()
    const result = axis['End'](ctx)
    expect(ctx.focusLast).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusLast' })
  })
})

describe('navVhUniform', () => {
  it('defines ArrowDown, ArrowUp, ArrowRight, ArrowLeft', () => {
    const axis = navVhUniform()
    expect(axis).toHaveProperty('ArrowDown')
    expect(axis).toHaveProperty('ArrowUp')
    expect(axis).toHaveProperty('ArrowRight')
    expect(axis).toHaveProperty('ArrowLeft')
  })

  it('does not define Home or End', () => {
    const axis = navVhUniform()
    expect(axis).not.toHaveProperty('Home')
    expect(axis).not.toHaveProperty('End')
  })

  it('all arrow keys call focusNext/focusPrev without wrap by default', () => {
    const ctx = makeMockCtx()
    const axis = navVhUniform()
    expect(axis['ArrowDown'](ctx)).toMatchObject({ type: 'focusNext' })
    expect(axis['ArrowUp'](ctx)).toMatchObject({ type: 'focusPrev' })
    expect(axis['ArrowRight'](ctx)).toMatchObject({ type: 'focusNext' })
    expect(axis['ArrowLeft'](ctx)).toMatchObject({ type: 'focusPrev' })
    expect(ctx.focusNext).toHaveBeenCalledWith(undefined)
    expect(ctx.focusPrev).toHaveBeenCalledWith(undefined)
  })

  it('all arrow keys pass { wrap: true } when wrap option is set', () => {
    const ctx = makeMockCtx()
    const axis = navVhUniform({ wrap: true })
    expect(axis['ArrowDown'](ctx)).toMatchObject({ type: 'focusNext:wrap' })
    expect(axis['ArrowUp'](ctx)).toMatchObject({ type: 'focusPrev:wrap' })
    expect(axis['ArrowRight'](ctx)).toMatchObject({ type: 'focusNext:wrap' })
    expect(axis['ArrowLeft'](ctx)).toMatchObject({ type: 'focusPrev:wrap' })
    expect(ctx.focusNext).toHaveBeenCalledWith({ wrap: true })
    expect(ctx.focusPrev).toHaveBeenCalledWith({ wrap: true })
  })
})

describe('navGrid', () => {
  it('defines ArrowDown, ArrowUp, ArrowRight, ArrowLeft, Home, End, Mod+Home, Mod+End', () => {
    const axis = navGrid()
    expect(axis).toHaveProperty('ArrowDown')
    expect(axis).toHaveProperty('ArrowUp')
    expect(axis).toHaveProperty('ArrowRight')
    expect(axis).toHaveProperty('ArrowLeft')
    expect(axis).toHaveProperty('Home')
    expect(axis).toHaveProperty('End')
    expect(axis).toHaveProperty('Mod+Home')
    expect(axis).toHaveProperty('Mod+End')
  })

  it('ArrowDown/ArrowUp call focusNext/focusPrev', () => {
    const ctx = makeMockCtx()
    const axis = navGrid()
    expect(axis['ArrowDown'](ctx)).toMatchObject({ type: 'focusNext' })
    expect(axis['ArrowUp'](ctx)).toMatchObject({ type: 'focusPrev' })
  })

  it('ArrowRight calls grid.focusNextCol() when grid is present', () => {
    const mockGrid = {
      colIndex: 0,
      colCount: 3,
      focusNextCol: vi.fn(() => makeCmd('focusNextCol')),
      focusPrevCol: vi.fn(() => makeCmd('focusPrevCol')),
      focusFirstCol: vi.fn(() => makeCmd('focusFirstCol')),
      focusLastCol: vi.fn(() => makeCmd('focusLastCol')),
    }
    const ctx = makeMockCtx({ grid: mockGrid })
    const axis = navGrid()
    const result = axis['ArrowRight'](ctx)
    expect(mockGrid.focusNextCol).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusNextCol' })
  })

  it('ArrowLeft calls grid.focusPrevCol() when grid is present', () => {
    const mockGrid = {
      colIndex: 1,
      colCount: 3,
      focusNextCol: vi.fn(() => makeCmd('focusNextCol')),
      focusPrevCol: vi.fn(() => makeCmd('focusPrevCol')),
      focusFirstCol: vi.fn(() => makeCmd('focusFirstCol')),
      focusLastCol: vi.fn(() => makeCmd('focusLastCol')),
    }
    const ctx = makeMockCtx({ grid: mockGrid })
    const axis = navGrid()
    const result = axis['ArrowLeft'](ctx)
    expect(mockGrid.focusPrevCol).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusPrevCol' })
  })

  it('Home calls grid.focusFirstCol() when grid is present', () => {
    const mockGrid = {
      colIndex: 1,
      colCount: 3,
      focusNextCol: vi.fn(() => makeCmd('focusNextCol')),
      focusPrevCol: vi.fn(() => makeCmd('focusPrevCol')),
      focusFirstCol: vi.fn(() => makeCmd('focusFirstCol')),
      focusLastCol: vi.fn(() => makeCmd('focusLastCol')),
    }
    const ctx = makeMockCtx({ grid: mockGrid })
    const axis = navGrid()
    const result = axis['Home'](ctx)
    expect(mockGrid.focusFirstCol).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusFirstCol' })
  })

  it('End calls grid.focusLastCol() when grid is present', () => {
    const mockGrid = {
      colIndex: 0,
      colCount: 3,
      focusNextCol: vi.fn(() => makeCmd('focusNextCol')),
      focusPrevCol: vi.fn(() => makeCmd('focusPrevCol')),
      focusFirstCol: vi.fn(() => makeCmd('focusFirstCol')),
      focusLastCol: vi.fn(() => makeCmd('focusLastCol')),
    }
    const ctx = makeMockCtx({ grid: mockGrid })
    const axis = navGrid()
    const result = axis['End'](ctx)
    expect(mockGrid.focusLastCol).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusLastCol' })
  })

  it('ArrowRight falls back to focusNext() when grid is absent', () => {
    const ctx = makeMockCtx()
    const axis = navGrid()
    const result = axis['ArrowRight'](ctx)
    expect(ctx.focusNext).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusNext' })
  })

  it('ArrowLeft falls back to focusPrev() when grid is absent', () => {
    const ctx = makeMockCtx()
    const axis = navGrid()
    const result = axis['ArrowLeft'](ctx)
    expect(ctx.focusPrev).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusPrev' })
  })

  it('Home falls back to focusFirst() when grid is absent', () => {
    const ctx = makeMockCtx()
    const axis = navGrid()
    const result = axis['Home'](ctx)
    expect(ctx.focusFirst).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusFirst' })
  })

  it('End falls back to focusLast() when grid is absent', () => {
    const ctx = makeMockCtx()
    const axis = navGrid()
    const result = axis['End'](ctx)
    expect(ctx.focusLast).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusLast' })
  })

  it('Mod+Home calls focusFirst() regardless of grid', () => {
    const mockGrid = {
      colIndex: 1,
      colCount: 3,
      focusNextCol: vi.fn(() => makeCmd('focusNextCol')),
      focusPrevCol: vi.fn(() => makeCmd('focusPrevCol')),
      focusFirstCol: vi.fn(() => makeCmd('focusFirstCol')),
      focusLastCol: vi.fn(() => makeCmd('focusLastCol')),
    }
    const ctx = makeMockCtx({ grid: mockGrid })
    const axis = navGrid()
    const result = axis['Mod+Home'](ctx)
    expect(ctx.focusFirst).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusFirst' })
  })

  it('Mod+End calls focusLast() regardless of grid', () => {
    const mockGrid = {
      colIndex: 0,
      colCount: 3,
      focusNextCol: vi.fn(() => makeCmd('focusNextCol')),
      focusPrevCol: vi.fn(() => makeCmd('focusPrevCol')),
      focusFirstCol: vi.fn(() => makeCmd('focusFirstCol')),
      focusLastCol: vi.fn(() => makeCmd('focusLastCol')),
    }
    const ctx = makeMockCtx({ grid: mockGrid })
    const axis = navGrid()
    const result = axis['Mod+End'](ctx)
    expect(ctx.focusLast).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'focusLast' })
  })
})

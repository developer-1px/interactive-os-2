// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { select } from '../axes/select'
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
    focusNext: vi.fn(() => makeCmd('focusNext')),
    focusPrev: vi.fn(() => makeCmd('focusPrev')),
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

describe('select()', () => {
  it('default: Space defined, mode multiple', () => {
    const axis = select()
    expect(axis.keyMap).toHaveProperty('Space')
    expect(axis.config).toMatchObject({ selectionMode: 'multiple' })
  })

  it('single mode: config selectionMode = single', () => {
    const axis = select({ mode: 'single' })
    expect(axis.config).toMatchObject({ selectionMode: 'single' })
  })

  it('extended=true adds Shift combos', () => {
    const axis = select({ extended: true })
    expect(axis.keyMap).toHaveProperty('Shift+ArrowDown')
    expect(axis.keyMap).toHaveProperty('Shift+ArrowUp')
    expect(axis.keyMap).toHaveProperty('Shift+Home')
    expect(axis.keyMap).toHaveProperty('Shift+End')
  })

  it('extended with single mode: no Shift combos (extended ignored)', () => {
    const axis = select({ mode: 'single', extended: true })
    expect(axis.keyMap).not.toHaveProperty('Shift+ArrowDown')
    expect(axis.keyMap).not.toHaveProperty('Shift+ArrowUp')
    expect(axis.keyMap).not.toHaveProperty('Shift+Home')
    expect(axis.keyMap).not.toHaveProperty('Shift+End')
  })

  it('Space calls toggleSelect()', () => {
    const axis = select()
    const ctx = makeMockCtx()
    const result = axis.keyMap['Space'](ctx)
    expect(ctx.toggleSelect).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'toggleSelect' })
  })

  it('Shift+ArrowDown calls extendSelection("next")', () => {
    const axis = select({ extended: true })
    const ctx = makeMockCtx()
    const result = axis.keyMap['Shift+ArrowDown'](ctx)
    expect(ctx.extendSelection).toHaveBeenCalledWith('next')
    expect(result).toMatchObject({ type: 'extendSelection:next' })
  })
})

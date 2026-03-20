import { describe, it, expect, vi } from 'vitest'
import { selectToggle } from '../axes/selectToggle'
import { selectExtended } from '../axes/selectExtended'
import { activate } from '../axes/activate'
import { activateFollowFocus } from '../axes/activateFollowFocus'
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

describe('selectToggle', () => {
  it('defines Space key', () => {
    expect(selectToggle).toHaveProperty('Space')
  })

  it('Space calls toggleSelect()', () => {
    const ctx = makeMockCtx()
    const result = selectToggle['Space'](ctx)
    expect(ctx.toggleSelect).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'toggleSelect' })
  })
})

describe('selectExtended', () => {
  it('defines Shift+ArrowDown, Shift+ArrowUp, Shift+Home, Shift+End', () => {
    expect(selectExtended).toHaveProperty('Shift+ArrowDown')
    expect(selectExtended).toHaveProperty('Shift+ArrowUp')
    expect(selectExtended).toHaveProperty('Shift+Home')
    expect(selectExtended).toHaveProperty('Shift+End')
  })

  it('Shift+ArrowDown calls extendSelection("next")', () => {
    const ctx = makeMockCtx()
    const result = selectExtended['Shift+ArrowDown'](ctx)
    expect(ctx.extendSelection).toHaveBeenCalledWith('next')
    expect(result).toMatchObject({ type: 'extendSelection:next' })
  })

  it('Shift+ArrowUp calls extendSelection("prev")', () => {
    const ctx = makeMockCtx()
    const result = selectExtended['Shift+ArrowUp'](ctx)
    expect(ctx.extendSelection).toHaveBeenCalledWith('prev')
    expect(result).toMatchObject({ type: 'extendSelection:prev' })
  })

  it('Shift+Home calls extendSelection("first")', () => {
    const ctx = makeMockCtx()
    const result = selectExtended['Shift+Home'](ctx)
    expect(ctx.extendSelection).toHaveBeenCalledWith('first')
    expect(result).toMatchObject({ type: 'extendSelection:first' })
  })

  it('Shift+End calls extendSelection("last")', () => {
    const ctx = makeMockCtx()
    const result = selectExtended['Shift+End'](ctx)
    expect(ctx.extendSelection).toHaveBeenCalledWith('last')
    expect(result).toMatchObject({ type: 'extendSelection:last' })
  })
})

describe('activate', () => {
  const activateAxis = activate()

  it('defines Enter and Space keys', () => {
    expect(activateAxis.keyMap).toHaveProperty('Enter')
    expect(activateAxis.keyMap).toHaveProperty('Space')
  })

  it('Enter calls activate()', () => {
    const ctx = makeMockCtx()
    const result = activateAxis.keyMap['Enter'](ctx)
    expect(ctx.activate).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'activate' })
  })

  it('Space calls activate()', () => {
    const ctx = makeMockCtx()
    const result = activateAxis.keyMap['Space'](ctx)
    expect(ctx.activate).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'activate' })
  })
})

describe('activateFollowFocus', () => {
  it('defines Enter and Space keys', () => {
    expect(activateFollowFocus).toHaveProperty('Enter')
    expect(activateFollowFocus).toHaveProperty('Space')
  })

  it('Enter calls activate()', () => {
    const ctx = makeMockCtx()
    const result = activateFollowFocus['Enter'](ctx)
    expect(ctx.activate).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'activate' })
  })

  it('Space calls activate()', () => {
    const ctx = makeMockCtx()
    const result = activateFollowFocus['Space'](ctx)
    expect(ctx.activate).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'activate' })
  })

  it('has identical keyMap to activate axis', () => {
    const activateAxis = activate()
    const enterHandlerActivate = activateAxis.keyMap['Enter']
    const enterHandlerFollowFocus = activateFollowFocus['Enter']
    const spaceHandlerActivate = activateAxis.keyMap['Space']
    const spaceHandlerFollowFocus = activateFollowFocus['Space']

    // Both should call activate
    const ctx1 = makeMockCtx()
    const ctx2 = makeMockCtx()
    enterHandlerActivate(ctx1)
    enterHandlerFollowFocus(ctx2)
    expect(ctx1.activate).toHaveBeenCalledTimes(1)
    expect(ctx2.activate).toHaveBeenCalledTimes(1)

    const ctx3 = makeMockCtx()
    const ctx4 = makeMockCtx()
    spaceHandlerActivate(ctx3)
    spaceHandlerFollowFocus(ctx4)
    expect(ctx3.activate).toHaveBeenCalledTimes(1)
    expect(ctx4.activate).toHaveBeenCalledTimes(1)
  })
})

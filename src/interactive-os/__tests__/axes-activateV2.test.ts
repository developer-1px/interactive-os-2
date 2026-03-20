import { describe, it, expect, vi } from 'vitest'
import { activate } from '../axes/activateV2'
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

describe('activate() v2 factory', () => {
  it('default: Enter and Space defined', () => {
    const axis = activate()
    expect(axis.keyMap).toHaveProperty('Enter')
    expect(axis.keyMap).toHaveProperty('Space')
  })

  it('default: no config flags set', () => {
    const axis = activate()
    expect(axis.config).not.toHaveProperty('activateOnClick')
    expect(axis.config).not.toHaveProperty('followFocus')
    expect(axis.config).not.toHaveProperty('expandable')
  })

  it('onClick: sets config.activateOnClick', () => {
    const axis = activate({ onClick: true })
    expect(axis.config).toMatchObject({ activateOnClick: true })
  })

  it('followFocus: sets config.followFocus', () => {
    const axis = activate({ followFocus: true })
    expect(axis.config).toMatchObject({ followFocus: true })
  })

  it('toggleExpand: sets config.expandable', () => {
    const axis = activate({ toggleExpand: true })
    expect(axis.config).toMatchObject({ expandable: true })
  })

  it('all options together', () => {
    const axis = activate({ onClick: true, followFocus: true, toggleExpand: true })
    expect(axis.config).toMatchObject({
      activateOnClick: true,
      followFocus: true,
      expandable: true,
    })
  })

  it('Enter calls ctx.activate()', () => {
    const axis = activate()
    const ctx = makeMockCtx()
    const result = axis.keyMap['Enter'](ctx)
    expect(ctx.activate).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'activate' })
  })

  it('Space calls ctx.activate()', () => {
    const axis = activate()
    const ctx = makeMockCtx()
    const result = axis.keyMap['Space'](ctx)
    expect(ctx.activate).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'activate' })
  })
})

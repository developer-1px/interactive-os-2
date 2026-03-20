import { describe, it, expect, vi } from 'vitest'
import { trap } from '../axes/trap'
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

describe('trap()', () => {
  it('default: Escape calls collapse()', () => {
    const { keyMap } = trap()
    const ctx = makeMockCtx()
    const result = keyMap['Escape'](ctx)
    expect(ctx.collapse).toHaveBeenCalled()
    expect(result).toMatchObject({ type: 'collapse' })
  })

  it('default: Escape key is present', () => {
    const { keyMap } = trap()
    expect(Object.keys(keyMap)).toContain('Escape')
  })

  it('escape: false disables Escape key', () => {
    const { keyMap } = trap({ escape: false })
    expect(keyMap['Escape']).toBeUndefined()
  })

  it('returns empty config', () => {
    const { config } = trap()
    expect(config).toEqual({})
  })

  it('escape: false also returns empty config', () => {
    const { config } = trap({ escape: false })
    expect(config).toEqual({})
  })
})

import { describe, it, expect, vi } from 'vitest'
import { composePattern } from '../axes/compose-pattern'
import type { Axis, PatternMetadata } from '../axes/compose-pattern'
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

const mockCtx: BehaviorContext = {
  focused: 'node-1',
  selected: [],
  isExpanded: false,
  focusNext: () => makeCmd('focusNext'),
  focusPrev: () => makeCmd('focusPrev'),
  focusFirst: () => makeCmd('focusFirst'),
  focusLast: () => makeCmd('focusLast'),
  focusParent: () => makeCmd('focusParent'),
  focusChild: () => makeCmd('focusChild'),
  expand: () => makeCmd('expand'),
  collapse: () => makeCmd('collapse'),
  activate: () => makeCmd('activate'),
  toggleSelect: () => makeCmd('toggleSelect'),
  extendSelection: (direction) => makeCmd(`extendSelection:${direction}`),
  extendSelectionTo: (targetId) => makeCmd(`extendSelectionTo:${targetId}`),
  dispatch: vi.fn(),
  getEntity: () => undefined,
  getChildren: () => [],
}

const baseMetadata: PatternMetadata = {
  role: 'listbox',
  focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
  ariaAttributes: () => ({}),
}

describe('composePattern', () => {
  it('merges non-overlapping axes into a single keyMap', () => {
    const axisA: Axis = {
      ArrowDown: (ctx) => ctx.focusNext(),
    }
    const axisB: Axis = {
      ArrowUp: (ctx) => ctx.focusPrev(),
    }

    const behavior = composePattern(baseMetadata, axisA, axisB)

    expect(behavior.keyMap).toHaveProperty('ArrowDown')
    expect(behavior.keyMap).toHaveProperty('ArrowUp')
    expect(behavior.keyMap['ArrowDown'](mockCtx)).toMatchObject({ type: 'focusNext' })
    expect(behavior.keyMap['ArrowUp'](mockCtx)).toMatchObject({ type: 'focusPrev' })
  })

  it('chain of responsibility — first non-void wins on same key', () => {
    const axisA: Axis = {
      Enter: (ctx) => ctx.activate(),
    }
    const axisB: Axis = {
      Enter: (ctx) => ctx.expand(),
    }

    const behavior = composePattern(baseMetadata, axisA, axisB)
    const result = behavior.keyMap['Enter'](mockCtx)

    expect(result).toMatchObject({ type: 'activate' })
  })

  it('chain of responsibility — void falls through to next axis', () => {
    const axisA: Axis = {
      Enter: () => undefined,
    }
    const axisB: Axis = {
      Enter: (ctx) => ctx.expand(),
    }

    const behavior = composePattern(baseMetadata, axisA, axisB)
    const result = behavior.keyMap['Enter'](mockCtx)

    expect(result).toMatchObject({ type: 'expand' })
  })

  it('all axes void → handler returns undefined', () => {
    const axisA: Axis = {
      Escape: () => undefined,
    }
    const axisB: Axis = {
      Escape: () => undefined,
    }

    const behavior = composePattern(baseMetadata, axisA, axisB)
    const result = behavior.keyMap['Escape'](mockCtx)

    expect(result).toBeUndefined()
  })

  it('metadata is passed through to AriaBehavior', () => {
    const meta: PatternMetadata = {
      role: 'tree',
      childRole: 'treeitem',
      focusStrategy: { type: 'aria-activedescendant', orientation: 'vertical' },
      expandable: true,
      selectionMode: 'multiple',
      activateOnClick: true,
      followFocus: false,
      colCount: 1,
      ariaAttributes: () => ({ 'aria-expanded': 'false' }),
    }

    const behavior = composePattern(meta)

    expect(behavior.role).toBe('tree')
    expect(behavior.childRole).toBe('treeitem')
    expect(behavior.focusStrategy).toEqual({ type: 'aria-activedescendant', orientation: 'vertical' })
    expect(behavior.expandable).toBe(true)
    expect(behavior.selectionMode).toBe('multiple')
    expect(behavior.activateOnClick).toBe(true)
    expect(behavior.followFocus).toBe(false)
    expect(behavior.colCount).toBe(1)
  })

  it('zero axes → empty keyMap', () => {
    const behavior = composePattern(baseMetadata)

    expect(behavior.keyMap).toEqual({})
  })

  it('axis reorder changes behavior on same key', () => {
    const axisFirst: Axis = {
      Space: (ctx) => ctx.toggleSelect(),
    }
    const axisSecond: Axis = {
      Space: (ctx) => ctx.activate(),
    }

    const behaviorAB = composePattern(baseMetadata, axisFirst, axisSecond)
    const behaviorBA = composePattern(baseMetadata, axisSecond, axisFirst)

    expect(behaviorAB.keyMap['Space'](mockCtx)).toMatchObject({ type: 'toggleSelect' })
    expect(behaviorBA.keyMap['Space'](mockCtx)).toMatchObject({ type: 'activate' })
  })

  it('expandable and activateOnClick metadata passthrough', () => {
    const meta: PatternMetadata = {
      ...baseMetadata,
      expandable: true,
      activateOnClick: true,
    }

    const behavior = composePattern(meta)

    expect(behavior.expandable).toBe(true)
    expect(behavior.activateOnClick).toBe(true)
  })

  it('axis using ctx.dispatch() can still return Command', () => {
    const dispatchSpy = vi.fn()
    const ctxWithDispatch: BehaviorContext = {
      ...mockCtx,
      dispatch: dispatchSpy,
    }

    const axis: Axis = {
      Tab: (ctx) => {
        const cmd = ctx.focusNext()
        ctx.dispatch(cmd)
        return cmd
      },
    }

    const behavior = composePattern(baseMetadata, axis)
    const result = behavior.keyMap['Tab'](ctxWithDispatch)

    expect(dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: 'focusNext' }))
    expect(result).toMatchObject({ type: 'focusNext' })
  })
})

// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { composePattern } from '../pattern/composePattern'
import type { PatternConfig, Identity } from '../pattern/composePattern'
import { isStructuredAxis, extractKeyMap, extractConfig } from '../axis/types'
import type { Axis, KeyMap, StructuredAxis, PatternContext } from '../axis/types'
import type { Command } from '../engine/types'
import { select } from '../axis/select'

function makeCmd(type: string): Command {
  return {
    type,
    execute: (s) => s,
  }
}

const mockCtx: PatternContext = {
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
  enterChild: (_parentId: string) => makeCmd('enterChild'),
  exitToParent: () => makeCmd('exitToParent'),
  startRename: (_nodeId: string) => makeCmd('startRename'),
  dispatch: vi.fn(),
  getEntity: () => undefined,
  getChildren: () => [],
}

const baseMetadata: PatternConfig = {
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

  it('metadata is passed through to AriaPattern', () => {
    const meta: PatternConfig = {
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
    const meta: PatternConfig = {
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
    const ctxWithDispatch: PatternContext = {
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

describe('v2 structured axis', () => {
  const identity: Identity = {
    role: 'listbox',
    ariaAttributes: () => ({}),
  }

  it('extracts keyMap from structured axis', () => {
    const structured: StructuredAxis = {
      keyMap: {
        ArrowDown: (ctx) => ctx.focusNext(),
      },
      config: {
        focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
      },
    }

    expect(isStructuredAxis(structured)).toBe(true)
    expect(extractKeyMap(structured)).toBe(structured.keyMap)
    expect(extractConfig(structured)).toEqual(structured.config)

    const behavior = composePattern(identity, structured)
    expect(behavior.keyMap['ArrowDown'](mockCtx)).toMatchObject({ type: 'focusNext' })
    expect(behavior.focusStrategy).toEqual({ type: 'roving-tabindex', orientation: 'vertical' })
  })

  it('merges config from multiple structured axes', () => {
    const axisA: StructuredAxis = {
      keyMap: { ArrowDown: (ctx) => ctx.focusNext() },
      config: {
        focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
        expandable: true,
      },
    }
    const axisB: StructuredAxis = {
      keyMap: { Space: (ctx) => ctx.toggleSelect() },
      config: {
        selectionMode: 'multiple',
      },
    }

    const behavior = composePattern(identity, axisA, axisB)

    expect(behavior.focusStrategy).toEqual({ type: 'roving-tabindex', orientation: 'vertical' })
    expect(behavior.expandable).toBe(true)
    expect(behavior.selectionMode).toBe('multiple')
    expect(behavior.keyMap).toHaveProperty('ArrowDown')
    expect(behavior.keyMap).toHaveProperty('Space')
  })

  it('mixes plain KeyMap and structured axis', () => {
    const plainAxis: KeyMap = {
      ArrowUp: (ctx) => ctx.focusPrev(),
    }
    const structured: StructuredAxis = {
      keyMap: { ArrowDown: (ctx) => ctx.focusNext() },
      config: {
        focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' },
      },
    }

    expect(isStructuredAxis(plainAxis)).toBe(false)
    expect(extractKeyMap(plainAxis)).toBe(plainAxis)
    expect(extractConfig(plainAxis)).toBeUndefined()

    const behavior = composePattern(identity, plainAxis, structured)

    expect(behavior.keyMap['ArrowUp'](mockCtx)).toMatchObject({ type: 'focusPrev' })
    expect(behavior.keyMap['ArrowDown'](mockCtx)).toMatchObject({ type: 'focusNext' })
    expect(behavior.focusStrategy).toEqual({ type: 'roving-tabindex', orientation: 'horizontal' })
  })

  it('defaults to natural-tab-order when no axis provides focusStrategy', () => {
    const axis: StructuredAxis = {
      keyMap: { Enter: (ctx) => ctx.activate() },
      config: { activateOnClick: true },
    }

    const behavior = composePattern(identity, axis)

    expect(behavior.focusStrategy).toEqual({ type: 'natural-tab-order', orientation: 'vertical' })
  })

  it('later axis config overwrites earlier on same key', () => {
    const axisA: StructuredAxis = {
      keyMap: {},
      config: {
        expandable: true,
        selectionMode: 'single',
      },
    }
    const axisB: StructuredAxis = {
      keyMap: {},
      config: {
        expandable: false,
        selectionMode: 'multiple',
      },
    }

    const behavior = composePattern(identity, axisA, axisB)

    expect(behavior.expandable).toBe(false)
    expect(behavior.selectionMode).toBe('multiple')
  })

  it('select() axis sets selectOnClick: true in composed behavior', () => {
    const behavior = composePattern(identity, select())
    expect(behavior.selectOnClick).toBe(true)
  })

  it('tabFocusStrategy takes precedence over focusStrategy', () => {
    const navAxis: StructuredAxis = {
      keyMap: { ArrowDown: (ctx) => ctx.focusNext() },
      config: {
        focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
      },
    }
    const tabAxis: StructuredAxis = {
      keyMap: {},
      config: {
        tabFocusStrategy: { type: 'natural-tab-order', orientation: 'both' },
      },
    }

    // tab before navigate — tab wins
    const behavior1 = composePattern(identity, tabAxis, navAxis)
    expect(behavior1.focusStrategy).toEqual({ type: 'natural-tab-order', orientation: 'both' })

    // navigate before tab — tab still wins
    const behavior2 = composePattern(identity, navAxis, tabAxis)
    expect(behavior2.focusStrategy).toEqual({ type: 'natural-tab-order', orientation: 'both' })
  })

  it('falls back to focusStrategy when no tabFocusStrategy', () => {
    const navAxis: StructuredAxis = {
      keyMap: {},
      config: {
        focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
      },
    }

    const behavior = composePattern(identity, navAxis)
    expect(behavior.focusStrategy).toEqual({ type: 'roving-tabindex', orientation: 'vertical' })
  })
})

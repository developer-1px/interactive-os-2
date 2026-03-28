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
  isChecked: false,
  focusNext: () => makeCmd('focusNext'),
  focusPrev: () => makeCmd('focusPrev'),
  focusFirst: () => makeCmd('focusFirst'),
  focusLast: () => makeCmd('focusLast'),
  focusParent: () => makeCmd('focusParent'),
  focusChild: () => makeCmd('focusChild'),
  expand: () => makeCmd('expand'),
  collapse: () => makeCmd('collapse'),
  activate: () => makeCmd('activate'),
  toggleCheck: () => makeCmd('toggleCheck'),
  isOpen: false,
  open: () => makeCmd('open'),
  close: () => makeCmd('close'),
  toggleSelect: () => makeCmd('toggleSelect'),
  extendSelection: (direction) => makeCmd(`extendSelection:${direction}`),
  extendSelectionTo: (targetId) => makeCmd(`extendSelectionTo:${targetId}`),
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
      selectionFollowsFocus: false,
      activationFollowsSelection: false,
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
    expect(behavior.selectionFollowsFocus).toBe(false)
    expect(behavior.activationFollowsSelection).toBe(false)
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

describe('AriaPattern base (recursive override)', () => {
  const identity: Identity = {
    role: 'tree',
    childRole: 'treeitem',
    ariaAttributes: () => ({ 'aria-expanded': 'false' }),
  }

  function makeBasePattern() {
    return composePattern(identity, {
      keyMap: {
        ArrowDown: (ctx) => ctx.focusNext(),
        Enter: (ctx) => ctx.expand(),
      },
      config: {
        focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
        expandable: true,
      },
    } satisfies StructuredAxis)
  }

  // V1: 2026-03-28-compose-pattern-recursive-prd.md
  it('AriaPattern base + axis — merges keyMap, preserves role', () => {
    const base = makeBasePattern()
    const popupAxis: StructuredAxis = {
      keyMap: { Escape: (ctx) => ctx.close() },
      config: { popupType: 'menu' },
    }

    const result = composePattern(base, popupAxis)

    expect(result.role).toBe('tree')
    expect(result.childRole).toBe('treeitem')
    expect(result.keyMap['ArrowDown'](mockCtx)).toMatchObject({ type: 'focusNext' })
    expect(result.keyMap['Escape'](mockCtx)).toMatchObject({ type: 'close' })
    expect(result.popupType).toBe('menu')
    expect(result.expandable).toBe(true)
  })

  // V2: 2026-03-28-compose-pattern-recursive-prd.md
  it('axis handler takes priority over base on same key (chain-of-responsibility)', () => {
    const base = makeBasePattern()
    const overrideAxis: KeyMap = {
      Enter: (ctx) => ctx.activate(),
    }

    const result = composePattern(base, overrideAxis)

    expect(result.keyMap['Enter'](mockCtx)).toMatchObject({ type: 'activate' })
  })

  // V2 supplement: void falls through to base
  it('axis void handler falls through to base handler', () => {
    const base = makeBasePattern()
    const overrideAxis: KeyMap = {
      Enter: () => undefined,
    }

    const result = composePattern(base, overrideAxis)

    expect(result.keyMap['Enter'](mockCtx)).toMatchObject({ type: 'expand' })
  })

  // V3: 2026-03-28-compose-pattern-recursive-prd.md
  it('existing Identity + axes call works unchanged (backward compat)', () => {
    const behavior = composePattern(identity, {
      ArrowDown: (ctx) => ctx.focusNext(),
    })

    expect(behavior.role).toBe('tree')
    expect(behavior.keyMap['ArrowDown'](mockCtx)).toMatchObject({ type: 'focusNext' })
  })

  // V4: 2026-03-28-compose-pattern-recursive-prd.md
  it('3-level recursive composition works', () => {
    const level1 = makeBasePattern()
    const level2 = composePattern(level1, {
      Space: (ctx) => ctx.toggleSelect(),
    } satisfies KeyMap)
    const level3 = composePattern(level2, {
      Escape: (ctx) => ctx.close(),
    } satisfies KeyMap)

    expect(level3.role).toBe('tree')
    expect(level3.keyMap['ArrowDown'](mockCtx)).toMatchObject({ type: 'focusNext' })
    expect(level3.keyMap['Space'](mockCtx)).toMatchObject({ type: 'toggleSelect' })
    expect(level3.keyMap['Escape'](mockCtx)).toMatchObject({ type: 'close' })
    expect(level3.expandable).toBe(true)
  })

  // V5: 2026-03-28-compose-pattern-recursive-prd.md
  it('base middleware + axis middleware — base innermost', () => {
    const calls: string[] = []
    const baseMw = (next: (cmd: Command) => void) => (cmd: Command) => {
      calls.push('base')
      next(cmd)
    }
    const axisMw = (next: (cmd: Command) => void) => (cmd: Command) => {
      calls.push('axis')
      next(cmd)
    }

    const baseWithMw = composePattern(identity, {
      keyMap: {},
      middleware: baseMw,
    } satisfies StructuredAxis)

    const result = composePattern(baseWithMw, {
      keyMap: {},
      middleware: axisMw,
    } satisfies StructuredAxis)

    // Execute middleware chain
    result.middleware!((cmd) => { calls.push('final') })(makeCmd('test'))

    // reduceRight: base pushed first → base is outer wrapper, axis is inner
    expect(calls).toEqual(['base', 'axis', 'final'])
  })

  // V6: 2026-03-28-compose-pattern-recursive-prd.md
  it('base visibilityFilters + axis filters — concatenated', () => {
    const baseFilter = () => true
    const axisFilter = () => false

    const baseWithFilter = composePattern(identity, {
      keyMap: {},
      visibilityFilter: baseFilter,
    } satisfies StructuredAxis)

    const result = composePattern(baseWithFilter, {
      keyMap: {},
      visibilityFilter: axisFilter,
    } satisfies StructuredAxis)

    expect(result.visibilityFilters).toHaveLength(2)
    expect(result.visibilityFilters![0]).toBe(baseFilter)
    expect(result.visibilityFilters![1]).toBe(axisFilter)
  })

  // V7: 2026-03-28-compose-pattern-recursive-prd.md
  it('axis config overrides base config', () => {
    const base = makeBasePattern()
    expect(base.expandable).toBe(true)

    const result = composePattern(base, {
      keyMap: {},
      config: { expandable: false },
    } satisfies StructuredAxis)

    expect(result.expandable).toBe(false)
  })

  // V8: 2026-03-28-compose-pattern-recursive-prd.md
  it('isAriaPattern does not misidentify StructuredAxis', () => {
    const structured: StructuredAxis = {
      keyMap: { ArrowDown: (ctx) => ctx.focusNext() },
      config: { expandable: true },
    }

    // StructuredAxis passed as axis (not base) should work as before
    const result = composePattern(identity, structured)
    expect(result.role).toBe('tree')
    expect(result.keyMap['ArrowDown'](mockCtx)).toMatchObject({ type: 'focusNext' })
  })

  it('zero axes with AriaPattern base — identity operation', () => {
    const base = makeBasePattern()
    const result = composePattern(base)

    expect(result.role).toBe(base.role)
    expect(result.childRole).toBe(base.childRole)
    expect(result.focusStrategy).toEqual(base.focusStrategy)
    expect(result.expandable).toBe(base.expandable)
    expect(Object.keys(result.keyMap)).toEqual(Object.keys(base.keyMap))
  })
})

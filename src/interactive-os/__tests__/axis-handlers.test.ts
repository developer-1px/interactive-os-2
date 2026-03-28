// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import type { PatternContext } from '../axis/types'
import type { Command } from '../engine/types'

import { focusNext, focusPrev, focusFirst, focusLast, focusParent, focusChild, focusNextCol, focusPrevCol, focusFirstCol, focusLastCol } from '../axis/navigate'
import { toggleSelect, extendSelectionNext, extendSelectionPrev, extendSelectionFirst, extendSelectionLast, select } from '../axis/select'
import { expandHandler, collapseHandler, expandOrFocusChild, collapseOrFocusParent, expand } from '../axis/expand'
import { activateHandler } from '../axis/activate'
import { incrementHandler, decrementHandler, incrementBig, decrementBig, setToMin, setToMax } from '../axis/value'
import { dismissHandler } from '../axis/dismiss'
import { toggleCheckHandler } from '../axis/checked'
import { openPopup, closePopup, openAndFocusFirst, openAndFocusLast } from '../axis/popup'
import { focusNextWrap, focusPrevWrap } from '../axis/tab'
import { navigate } from '../axis/navigate'

function makeCmd(type: string): Command {
  return { type, execute: (s) => s }
}

const mockCtx: PatternContext = {
  focused: 'node-1',
  selected: [],
  isExpanded: false,
  isChecked: false,
  isOpen: false,
  focusNext: (opts?) => makeCmd(opts?.wrap ? 'focusNext:wrap' : 'focusNext'),
  focusPrev: (opts?) => makeCmd(opts?.wrap ? 'focusPrev:wrap' : 'focusPrev'),
  focusFirst: () => makeCmd('focusFirst'),
  focusLast: () => makeCmd('focusLast'),
  focusParent: () => makeCmd('focusParent'),
  focusChild: () => makeCmd('focusChild'),
  expand: () => makeCmd('expand'),
  collapse: () => makeCmd('collapse'),
  activate: () => makeCmd('activate'),
  toggleCheck: () => makeCmd('toggleCheck'),
  open: () => makeCmd('open'),
  close: () => makeCmd('close'),
  toggleSelect: () => makeCmd('toggleSelect'),
  extendSelection: (dir) => makeCmd(`extendSelection:${dir}`),
  extendSelectionTo: (id) => makeCmd(`extendSelectionTo:${id}`),
  dispatch: vi.fn(),
  getEntity: () => undefined,
  getChildren: () => [],
}

describe('axis handler exports', () => {
  // V1: 2026-03-28-axis-handlers-export-prd.md
  it('navigate handlers return correct commands', () => {
    expect(focusNext(mockCtx)).toMatchObject({ type: 'focusNext' })
    expect(focusPrev(mockCtx)).toMatchObject({ type: 'focusPrev' })
    expect(focusFirst(mockCtx)).toMatchObject({ type: 'focusFirst' })
    expect(focusLast(mockCtx)).toMatchObject({ type: 'focusLast' })
    expect(focusParent(mockCtx)).toMatchObject({ type: 'focusParent' })
    expect(focusChild(mockCtx)).toMatchObject({ type: 'focusChild' })
  })

  // V3: 2026-03-28-axis-handlers-export-prd.md
  it('expand conditional handlers — expandOrFocusChild', () => {
    // isExpanded = false → expand
    expect(expandOrFocusChild(mockCtx)).toMatchObject({ type: 'expand' })

    // V4: isExpanded = true → focusChild
    const expandedCtx = { ...mockCtx, isExpanded: true }
    expect(expandOrFocusChild(expandedCtx)).toMatchObject({ type: 'focusChild' })
  })

  it('expand conditional handlers — collapseOrFocusParent', () => {
    // isExpanded = false → focusParent
    expect(collapseOrFocusParent(mockCtx)).toMatchObject({ type: 'focusParent' })

    // isExpanded = true → collapse
    const expandedCtx = { ...mockCtx, isExpanded: true }
    expect(collapseOrFocusParent(expandedCtx)).toMatchObject({ type: 'collapse' })
  })

  it('expand/collapse base handlers', () => {
    expect(expandHandler(mockCtx)).toMatchObject({ type: 'expand' })
    expect(collapseHandler(mockCtx)).toMatchObject({ type: 'collapse' })
  })

  it('select handlers return correct commands', () => {
    expect(toggleSelect(mockCtx)).toMatchObject({ type: 'toggleSelect' })
    expect(extendSelectionNext(mockCtx)).toMatchObject({ type: 'extendSelection:next' })
    expect(extendSelectionPrev(mockCtx)).toMatchObject({ type: 'extendSelection:prev' })
    expect(extendSelectionFirst(mockCtx)).toMatchObject({ type: 'extendSelection:first' })
    expect(extendSelectionLast(mockCtx)).toMatchObject({ type: 'extendSelection:last' })
  })

  it('activate/dismiss/toggleCheck handlers', () => {
    expect(activateHandler(mockCtx)).toMatchObject({ type: 'activate' })
    expect(dismissHandler(mockCtx)).toMatchObject({ type: 'collapse' })
    expect(toggleCheckHandler(mockCtx)).toMatchObject({ type: 'toggleCheck' })
  })

  it('tab wrap handlers', () => {
    expect(focusNextWrap(mockCtx)).toMatchObject({ type: 'focusNext:wrap' })
    expect(focusPrevWrap(mockCtx)).toMatchObject({ type: 'focusPrev:wrap' })
  })

  // V5: 2026-03-28-axis-handlers-export-prd.md
  it('grid handlers return void when no grid context', () => {
    expect(focusNextCol(mockCtx)).toBeUndefined()
    expect(focusPrevCol(mockCtx)).toBeUndefined()
    expect(focusFirstCol(mockCtx)).toBeUndefined()
    expect(focusLastCol(mockCtx)).toBeUndefined()
  })

  it('grid handlers work with grid context', () => {
    const gridCtx = {
      ...mockCtx,
      grid: {
        colIndex: 0,
        colCount: 3,
        focusNextCol: () => makeCmd('focusNextCol'),
        focusPrevCol: () => makeCmd('focusPrevCol'),
        focusFirstCol: () => makeCmd('focusFirstCol'),
        focusLastCol: () => makeCmd('focusLastCol'),
      },
    }
    expect(focusNextCol(gridCtx)).toMatchObject({ type: 'focusNextCol' })
    expect(focusPrevCol(gridCtx)).toMatchObject({ type: 'focusPrevCol' })
    expect(focusFirstCol(gridCtx)).toMatchObject({ type: 'focusFirstCol' })
    expect(focusLastCol(gridCtx)).toMatchObject({ type: 'focusLastCol' })
  })

  // V6: 2026-03-28-axis-handlers-export-prd.md
  it('value handlers return void when no value context', () => {
    expect(incrementHandler(mockCtx)).toBeUndefined()
    expect(decrementHandler(mockCtx)).toBeUndefined()
    expect(incrementBig(mockCtx)).toBeUndefined()
    expect(decrementBig(mockCtx)).toBeUndefined()
    expect(setToMin(mockCtx)).toBeUndefined()
    expect(setToMax(mockCtx)).toBeUndefined()
  })

  // V9: 2026-03-28-axis-handlers-export-prd.md
  it('value incrementBig uses step×10', () => {
    const valueCtx = {
      ...mockCtx,
      value: {
        current: 50,
        min: 0,
        max: 100,
        step: 1,
        increment: (step?: number) => makeCmd(`increment:${step}`),
        decrement: (step?: number) => makeCmd(`decrement:${step}`),
        setToMin: () => makeCmd('setToMin'),
        setToMax: () => makeCmd('setToMax'),
        setValue: () => makeCmd('setValue'),
      },
    }
    expect(incrementBig(valueCtx)).toMatchObject({ type: 'increment:10' })
    expect(decrementBig(valueCtx)).toMatchObject({ type: 'decrement:10' })
  })

  // V8: 2026-03-28-axis-handlers-export-prd.md
  it('popup handlers return void when conditions not met', () => {
    // openPopup: not open, no children → void
    expect(openPopup(mockCtx)).toBeUndefined()

    // closePopup: not open → void
    expect(closePopup(mockCtx)).toBeUndefined()

    // openAndFocusFirst: no children → void
    expect(openAndFocusFirst(mockCtx)).toBeUndefined()
    expect(openAndFocusLast(mockCtx)).toBeUndefined()
  })

  // V7: 2026-03-28-axis-handlers-export-prd.md
  it('select() keyMap references exported handler (rewire)', () => {
    const sel = select()
    expect(sel.keyMap['Space']).toBe(toggleSelect)
  })

  it('expand() keyMap references exported handlers (rewire)', () => {
    const exp = expand()
    expect(exp.keyMap['ArrowRight']).toBe(expandOrFocusChild)
    expect(exp.keyMap['ArrowLeft']).toBe(collapseOrFocusParent)
  })
})

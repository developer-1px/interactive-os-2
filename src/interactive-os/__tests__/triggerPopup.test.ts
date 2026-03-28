// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { triggerPopup } from '../axis/triggerPopup'
import type { PatternContext } from '../axis/types'
import type { Command } from '../engine/types'

function makeCmd(type: string): Command {
  return { type, execute: (s) => s }
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
  enterChild: () => makeCmd('enterChild'),
  exitToParent: () => makeCmd('exitToParent'),
  startRename: () => makeCmd('startRename'),
  dispatch: vi.fn(),
  getEntity: () => undefined,
  getChildren: () => [],
}

describe('triggerPopup axis', () => {
  // V6: 2026-03-28-overlay-core-layer-prd.md
  it('Enter/Space trigger activate for click mode', () => {
    const { keyMap } = triggerPopup({ openOn: 'click' })
    expect(keyMap.Enter).toBeDefined()
    expect(keyMap.Space).toBeDefined()

    const enterResult = keyMap.Enter!(mockCtx)
    expect(enterResult).toMatchObject({ type: 'activate' })
  })

  // V6: 2026-03-28-overlay-core-layer-prd.md
  it('ArrowDown triggers expand', () => {
    const { keyMap } = triggerPopup({ openOn: 'click' })
    const result = keyMap.ArrowDown!(mockCtx)
    expect(result).toMatchObject({ type: 'expand' })
  })

  it('ArrowUp triggers expand + focusLast', () => {
    const { keyMap } = triggerPopup({ openOn: 'click' })
    const result = keyMap.ArrowUp!(mockCtx)
    expect(result).toMatchObject({ type: 'focusLast' })
  })

  it('hover mode produces no keyMap entries', () => {
    const { keyMap } = triggerPopup({ openOn: 'hover' })
    expect(Object.keys(keyMap)).toHaveLength(0)
  })

  it('default config is openOn=click, popupRole=menu', () => {
    const { triggerConfig } = triggerPopup()
    expect(triggerConfig.openOn).toBe('click')
    expect(triggerConfig.popupRole).toBe('menu')
  })

  // V16: 2026-03-28-overlay-core-layer-prd.md
  it('triggerConfig reflects custom popupRole', () => {
    const { triggerConfig } = triggerPopup({ popupRole: 'listbox' })
    expect(triggerConfig.popupRole).toBe('listbox')
  })
})

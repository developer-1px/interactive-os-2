// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { dismiss } from '../axis/dismiss'
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

describe('dismiss axis (extended)', () => {
  it('default: escape=true, clickOutside=false, focusOut=false', () => {
    const { dismissConfig } = dismiss()
    expect(dismissConfig.escape).toBe(true)
    expect(dismissConfig.clickOutside).toBe(false)
    expect(dismissConfig.focusOut).toBe(false)
  })

  it('Escape key calls collapse', () => {
    const { keyMap } = dismiss()
    const result = keyMap.Escape!(mockCtx)
    expect(result).toMatchObject({ type: 'collapse' })
  })

  it('escape=false removes Escape from keyMap', () => {
    const { keyMap } = dismiss({ escape: false })
    expect(keyMap.Escape).toBeUndefined()
  })

  it('clickOutside option is exposed in dismissConfig', () => {
    const { dismissConfig } = dismiss({ clickOutside: true })
    expect(dismissConfig.clickOutside).toBe(true)
  })

  it('focusOut option is exposed in dismissConfig', () => {
    const { dismissConfig } = dismiss({ focusOut: true })
    expect(dismissConfig.focusOut).toBe(true)
  })

  it('backward compatible — existing callers get same keyMap shape', () => {
    const result = dismiss()
    expect(result.keyMap).toBeDefined()
    expect(result.config).toBeDefined()
    expect(Object.keys(result.keyMap)).toEqual(['Escape'])
  })
})

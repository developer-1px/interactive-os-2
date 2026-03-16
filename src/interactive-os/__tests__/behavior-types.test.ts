import { describe, it, expect } from 'vitest'
import type {
  AriaBehavior,
  BehaviorContext,
  NodeState,
  FocusStrategy,
} from '../behaviors/types'
import type { Command } from '../core/types'

describe('Behavior Types', () => {
  it('AriaBehavior defines role, keyMap, focusStrategy, ariaAttributes', () => {
    const mockCommand: Command = {
      type: 'test',
      payload: null,
      execute: (s) => s,
      undo: (s) => s,
    }

    const behavior: AriaBehavior = {
      role: 'treegrid',
      keyMap: {
        ArrowDown: () => mockCommand,
        ArrowUp: () => mockCommand,
      },
      focusStrategy: {
        type: 'roving-tabindex',
        orientation: 'vertical',
      },
      ariaAttributes: (_node, state) => ({
        'aria-expanded': String(state.expanded ?? false),
        'aria-level': String(state.level ?? 0),
      }),
    }

    expect(behavior.role).toBe('treegrid')
    expect(Object.keys(behavior.keyMap)).toContain('ArrowDown')
    expect(behavior.focusStrategy.type).toBe('roving-tabindex')
  })

  it('NodeState has common fields with optional tree fields', () => {
    const state: NodeState = {
      focused: true,
      selected: false,
      disabled: false,
      index: 0,
      siblingCount: 3,
      expanded: true,
      level: 2,
    }
    expect(state.focused).toBe(true)
    expect(state.expanded).toBe(true)
    expect(state.level).toBe(2)
  })

  it('NodeState supports custom extensions', () => {
    interface TimelineState extends NodeState {
      currentTime: number
      duration: number
    }
    const state: TimelineState = {
      focused: false,
      selected: false,
      disabled: false,
      index: 0,
      siblingCount: 1,
      currentTime: 42,
      duration: 120,
    }
    expect(state.currentTime).toBe(42)
  })

  it('FocusStrategy supports both roving-tabindex and aria-activedescendant', () => {
    const roving: FocusStrategy = { type: 'roving-tabindex', orientation: 'vertical' }
    const ad: FocusStrategy = { type: 'aria-activedescendant', orientation: 'horizontal' }
    expect(roving.type).toBe('roving-tabindex')
    expect(ad.type).toBe('aria-activedescendant')
  })
})

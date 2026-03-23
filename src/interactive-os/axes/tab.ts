import type { BehaviorContext, FocusStrategy } from '../behaviors/types'
import type { AxisConfig, KeyMap } from './composePattern'

export type TabStrategy = 'native' | 'flow' | 'loop' | 'escape'

export interface TabOptions {
  orientation?: FocusStrategy['orientation']
}

/**
 * Tab navigation strategy axis.
 *
 * - `native`: engine does not intervene with Tab at all
 * - `flow`: all nodes tabIndex=0, browser Tab navigates in DOM order
 * - `loop`: like flow, but wraps last→first / first→last
 * - `escape`: roving-tabindex, Tab exits the zone
 *
 * **Warning:** Do not combine `tab('loop')` with `navigate({ grid: { tabCycle: true } })` —
 * both define Tab keyMap handlers and will conflict.
 */
export function tab(strategy: TabStrategy, options?: TabOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  if (strategy === 'native') {
    return { keyMap: {}, config: {} }
  }

  if (strategy === 'flow') {
    return {
      keyMap: {},
      config: {
        tabFocusStrategy: { type: 'natural-tab-order', orientation: 'both' },
      },
    }
  }

  if (strategy === 'loop') {
    const keyMap: KeyMap = {
      Tab: (ctx: BehaviorContext) => ctx.focusNext({ wrap: true }),
      'Shift+Tab': (ctx: BehaviorContext) => ctx.focusPrev({ wrap: true }),
    }
    return {
      keyMap,
      config: {
        tabFocusStrategy: { type: 'natural-tab-order', orientation: 'both' },
      },
    }
  }

  // escape
  const orientation = options?.orientation ?? 'both'
  return {
    keyMap: {},
    config: {
      tabFocusStrategy: { type: 'roving-tabindex', orientation },
    },
  }
}

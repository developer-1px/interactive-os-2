import type { PatternContext, FocusStrategy } from './types'
import type { AxisConfig, KeyMap } from './types'
import type { Command } from '../engine/types'

// ② 2026-03-28-axis-handlers-export-prd.md
export const focusNextWrap = (ctx: PatternContext): Command => ctx.focusNext({ wrap: true })
export const focusPrevWrap = (ctx: PatternContext): Command => ctx.focusPrev({ wrap: true })

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
      Tab: focusNextWrap,
      'Shift+Tab': focusPrevWrap,
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

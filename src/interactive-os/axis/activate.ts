import type { AxisConfig, KeyMap, PatternContext } from './types'
import type { Command } from '../engine/types'

// ② 2026-03-28-axis-handlers-export-prd.md
export const activateHandler = (ctx: PatternContext): Command => ctx.activate()

/** Config-only: provides activateOnClick config, no keyMap. Pattern declares bindings. */
export function activateConfig(options?: { expandOnClick?: boolean }): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  return {
    keyMap: {},
    config: {
      activateOnClick: true,
      expandOnParentClick: options?.expandOnClick ?? true,
    },
  }
}


import type { AxisConfig, KeyMap, PatternContext } from './types'
import type { Command } from '../engine/types'

// ② 2026-03-28-axis-handlers-export-prd.md
export const dismissHandler = (ctx: PatternContext): Command => ctx.collapse()

interface DismissOptions {
  escape?: boolean // default true
}

export function dismiss(options?: DismissOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const escape = options?.escape ?? true
  const keyMap: KeyMap = {}
  if (escape) {
    keyMap.Escape = dismissHandler
  }
  return { keyMap, config: {} }
}

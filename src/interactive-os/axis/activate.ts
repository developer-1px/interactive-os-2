import type { AxisConfig, KeyMap, PatternContext } from './types'
import type { Command } from '../engine/types'

// ② 2026-03-28-axis-handlers-export-prd.md
export const activateHandler = (ctx: PatternContext): Command => ctx.activate()

interface ActivateOptions {
  onClick?: boolean
  activationFollowsSelection?: boolean
  toggleExpand?: boolean
  /** When true (default), clicking a parent node toggles expand even when onActivate is provided. Set false for navigation trees where parent click = navigate only. */
  expandOnClick?: boolean
}

// ② 2026-03-26-treeview-click-expand-prd.md
export function activate(options?: ActivateOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const keyMap: KeyMap = {
    Enter: activateHandler,
    Space: activateHandler,
  }

  const config: Partial<AxisConfig> = {}
  if (options?.onClick) {
    config.activateOnClick = true
    config.expandOnParentClick = options.expandOnClick ?? true
  }
  if (options?.activationFollowsSelection) config.activationFollowsSelection = true
  if (options?.toggleExpand) config.expandable = true

  return { keyMap, config }
}

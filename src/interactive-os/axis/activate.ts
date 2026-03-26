import type { AxisConfig, KeyMap } from './types'

interface ActivateOptions {
  onClick?: boolean
  followFocus?: boolean
  toggleExpand?: boolean
  /** When true (default), clicking a parent node toggles expand even when onActivate is provided. Set false for navigation trees where parent click = navigate only. */
  expandOnClick?: boolean
}

// ② 2026-03-26-treeview-click-expand-prd.md
export function activate(options?: ActivateOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const keyMap: KeyMap = {
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  }

  const config: Partial<AxisConfig> = {}
  if (options?.onClick) {
    config.activateOnClick = true
    // APG File Directory: click on parent = expand toggle. Default true when onClick is enabled.
    config.expandOnParentClick = options.expandOnClick ?? true
  }
  if (options?.followFocus) config.followFocus = true
  if (options?.toggleExpand) config.expandable = true

  return { keyMap, config }
}

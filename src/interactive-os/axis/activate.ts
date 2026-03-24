import type { AxisConfig, KeyMap } from './types'

interface ActivateOptions {
  onClick?: boolean
  followFocus?: boolean
  toggleExpand?: boolean
}

export function activate(options?: ActivateOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const keyMap: KeyMap = {
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  }

  const config: Partial<AxisConfig> = {}
  if (options?.onClick) config.activateOnClick = true
  if (options?.followFocus) config.followFocus = true
  if (options?.toggleExpand) config.expandable = true

  return { keyMap, config }
}

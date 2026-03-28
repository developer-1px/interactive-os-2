import type { AxisConfig, KeyMap } from './types'

export interface DismissOptions {
  escape?: boolean // default true
  /** Declarative: overlay closes on click outside. DOM handling by useOverlay, not this axis. */
  clickOutside?: boolean // default false
  /** Declarative: overlay closes on focus out. DOM handling by useOverlay, not this axis. */
  focusOut?: boolean // default false
}

export function dismiss(options?: DismissOptions): { keyMap: KeyMap; config: Partial<AxisConfig>; dismissConfig: DismissConfig } {
  const escape = options?.escape ?? true
  const clickOutside = options?.clickOutside ?? false
  const focusOut = options?.focusOut ?? false
  const keyMap: KeyMap = {}
  if (escape) {
    keyMap.Escape = (ctx) => ctx.collapse()
  }
  return { keyMap, config: {}, dismissConfig: { escape, clickOutside, focusOut } }
}

export interface DismissConfig {
  escape: boolean
  clickOutside: boolean
  focusOut: boolean
}

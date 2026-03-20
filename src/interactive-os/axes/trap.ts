import type { AxisConfig, KeyMap } from './composePattern'

interface TrapOptions {
  escape?: boolean // default true
}

export function trap(options?: TrapOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const escape = options?.escape ?? true
  const keyMap: KeyMap = {}
  if (escape) {
    keyMap.Escape = (ctx) => ctx.collapse()
  }
  return { keyMap, config: {} }
}

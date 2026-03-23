import type { AxisConfig, KeyMap } from './composePattern'

interface DismissOptions {
  escape?: boolean // default true
}

export function dismiss(options?: DismissOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const escape = options?.escape ?? true
  const keyMap: KeyMap = {}
  if (escape) {
    keyMap.Escape = (ctx) => ctx.collapse()
  }
  return { keyMap, config: {} }
}

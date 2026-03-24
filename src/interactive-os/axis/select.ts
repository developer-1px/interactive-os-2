import type { AxisConfig, KeyMap } from './types'
import type { SelectionMode } from './types'

interface SelectOptions {
  mode?: SelectionMode  // 'single' | 'multiple', default 'multiple'
  extended?: boolean     // add Shift combos, only when mode='multiple'
}

export function select(options?: SelectOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const mode = options?.mode ?? 'multiple'
  const extended = options?.extended && mode === 'multiple'

  const keyMap: KeyMap = {
    Space: (ctx) => ctx.toggleSelect(),
  }

  if (extended) {
    keyMap['Shift+ArrowDown'] = (ctx) => ctx.extendSelection('next')
    keyMap['Shift+ArrowUp'] = (ctx) => ctx.extendSelection('prev')
    keyMap['Shift+Home'] = (ctx) => ctx.extendSelection('first')
    keyMap['Shift+End'] = (ctx) => ctx.extendSelection('last')
  }

  return { keyMap, config: { selectionMode: mode, selectOnClick: true } }
}

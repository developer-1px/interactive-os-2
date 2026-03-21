import type { AxisConfig, KeyMap } from './composePattern'
import type { BehaviorContext } from '../behaviors/types'

interface ValueOptions {
  min: number
  max: number
  step: number
  orientation?: 'horizontal' | 'vertical'
}

export function value(options: ValueOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const { min, max, step, orientation = 'horizontal' } = options
  const bigStep = step * 10

  const keyMap: KeyMap = {
    PageUp: (ctx: BehaviorContext) => ctx.value?.increment(bigStep),
    PageDown: (ctx: BehaviorContext) => ctx.value?.decrement(bigStep),
    Home: (ctx: BehaviorContext) => ctx.value?.setToMin(),
    End: (ctx: BehaviorContext) => ctx.value?.setToMax(),
  }

  keyMap['ArrowUp'] = (ctx: BehaviorContext) => ctx.value?.increment()
  keyMap['ArrowDown'] = (ctx: BehaviorContext) => ctx.value?.decrement()

  if (orientation === 'horizontal') {
    keyMap['ArrowRight'] = (ctx: BehaviorContext) => ctx.value?.increment()
    keyMap['ArrowLeft'] = (ctx: BehaviorContext) => ctx.value?.decrement()
  }

  return {
    keyMap,
    config: {
      valueRange: { min, max, step },
    },
  }
}

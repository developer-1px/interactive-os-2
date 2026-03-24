import type { AxisConfig, KeyMap } from './types'
import type { PatternContext } from './types'

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
    PageUp: (ctx: PatternContext) => ctx.value?.increment(bigStep),
    PageDown: (ctx: PatternContext) => ctx.value?.decrement(bigStep),
    Home: (ctx: PatternContext) => ctx.value?.setToMin(),
    End: (ctx: PatternContext) => ctx.value?.setToMax(),
  }

  keyMap['ArrowUp'] = (ctx: PatternContext) => ctx.value?.increment()
  keyMap['ArrowDown'] = (ctx: PatternContext) => ctx.value?.decrement()

  if (orientation === 'horizontal') {
    keyMap['ArrowRight'] = (ctx: PatternContext) => ctx.value?.increment()
    keyMap['ArrowLeft'] = (ctx: PatternContext) => ctx.value?.decrement()
  }

  return {
    keyMap,
    config: {
      valueRange: { min, max, step },
    },
  }
}

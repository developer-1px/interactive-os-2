import type { AxisConfig, KeyMap } from './types'
import type { PatternContext } from './types'
import type { Command } from '../engine/types'

// ② 2026-03-26-core-absorption-prd.md
export const VALUE_ID = '__value__'

export interface ValueRange {
  min: number
  max: number
  step: number
}

function clamp(v: number, min: number, max: number): number {
  return Math.min(Math.max(v, min), max)
}

/** Round to avoid floating-point drift (e.g. 0.1 + 0.2 !== 0.3) */
function roundToStep(v: number, step: number): number {
  const precision = Math.max(
    (step.toString().split('.')[1] || '').length,
    (v.toString().split('.')[1] || '').length,
  )
  return Number(v.toFixed(precision))
}

export const valueCommands = {
  setValue(v: number, range: ValueRange): Command {
    const clamped = clamp(roundToStep(v, range.step), range.min, range.max)
    return {
      type: 'core:set-value',
      payload: { value: clamped },
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [VALUE_ID]: { id: VALUE_ID, value: clamped, min: range.min, max: range.max, step: range.step },
          },
        }
      },
    }
  },

  increment(step: number, range: ValueRange): Command {
    return {
      type: 'core:increment-value',
      payload: { step },
      execute(store) {
        const current = ((store.entities[VALUE_ID] as Record<string, unknown>)?.value as number) ?? range.min
        const next = clamp(roundToStep(current + step, range.step), range.min, range.max)
        return {
          ...store,
          entities: {
            ...store.entities,
            [VALUE_ID]: { id: VALUE_ID, value: next, min: range.min, max: range.max, step: range.step },
          },
        }
      },
    }
  },

  decrement(step: number, range: ValueRange): Command {
    return valueCommands.increment(-step, range)
  },
}

// ② 2026-03-28-axis-handlers-export-prd.md
export const incrementHandler = (ctx: PatternContext): Command | void => ctx.value?.increment()
export const decrementHandler = (ctx: PatternContext): Command | void => ctx.value?.decrement()
export const incrementBig = (ctx: PatternContext): Command | void => ctx.value?.increment(ctx.value.step * 10)
export const decrementBig = (ctx: PatternContext): Command | void => ctx.value?.decrement(ctx.value.step * 10)
export const setToMin = (ctx: PatternContext): Command | void => ctx.value?.setToMin()
export const setToMax = (ctx: PatternContext): Command | void => ctx.value?.setToMax()

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
    Home: setToMin,
    End: setToMax,
  }

  keyMap['ArrowUp'] = incrementHandler
  keyMap['ArrowDown'] = decrementHandler

  if (orientation === 'horizontal') {
    keyMap['ArrowRight'] = incrementHandler
    keyMap['ArrowLeft'] = decrementHandler
  }

  return {
    keyMap,
    config: {
      valueRange: { min, max, step },
    },
  }
}

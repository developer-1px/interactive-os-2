import type { CtxFactory, ValueNav } from './types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { key } from './types'
import { VALUE_ID, valueCommands } from '../core'
import type { ValueRange } from '../core'

// Re-export for backwards compatibility during migration
export { VALUE_ID, valueCommands }
export type { ValueRange }

// ② 2026-03-29-ctx-axis-namespace-prd.md
export function valueCtx(
  engine: CommandEngine,
  _focusedId: string,
  range: ValueRange,
): ValueNav {
  const store = engine.getStore()
  const currentValue = ((store.entities[VALUE_ID] as Record<string, unknown>)?.value as number) ?? range.min
  return {
    current: currentValue,
    min: range.min,
    max: range.max,
    step: range.step,
    increment: (s?: number) => valueCommands.increment(s ?? range.step, range),
    decrement: (s?: number) => valueCommands.decrement(s ?? range.step, range),
    setToMin: () => valueCommands.setValue(range.min, range),
    setToMax: () => valueCommands.setValue(range.max, range),
    setValue: (v: number) => valueCommands.setValue(v, range),
  }
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
export function value(range: ValueRange) {
  const increment = key(['core:increment-value'], (ctx) => ctx.value?.increment())
  const decrement = key(['core:increment-value'], (ctx) => ctx.value?.decrement())
  const incrementBig_ = key(['core:increment-value'], (ctx) => ctx.value?.increment(ctx.value!.step * 10))
  const decrementBig_ = key(['core:increment-value'], (ctx) => ctx.value?.decrement(ctx.value!.step * 10))
  const setToMin_ = key(['core:set-value'], (ctx) => ctx.value?.setToMin())
  const setToMax_ = key(['core:set-value'], (ctx) => ctx.value?.setToMax())

  return {
    keyMap: {} as Record<string, never>,
    meta: { valueRange: range },
    stateGen: ((_id, store) => {
      const valueMeta = store.entities[VALUE_ID] as Record<string, unknown> | undefined
      return { valueCurrent: (valueMeta?.value as number) ?? range.min }
    }) as import('./types').StateGen,
    ariaGen: ((s) => ({
      'aria-valuenow': String(s.valueCurrent ?? range.min),
      'aria-valuemin': String(range.min),
      'aria-valuemax': String(range.max),
    })) as import('./types').AriaGen,
    ctxFactory: ((engine, focusedId) => ({
      value: valueCtx(engine, focusedId, range),
    })) as CtxFactory,
    // handlers
    increment,
    decrement,
    incrementBig: incrementBig_,
    decrementBig: decrementBig_,
    setToMin: setToMin_,
    setToMax: setToMax_,
  }
}

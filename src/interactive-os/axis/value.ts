import type { CtxFactory } from './types'
import { key } from './types'
import type { Command } from '../engine/types'
import { defineCommands } from '../engine/defineCommand'

// ② 2026-03-29-define-command-prd.md
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

const _valueCommands = defineCommands({
  setValue: {
    type: 'core:set-value' as const,
    create: (v: number, range: ValueRange) => {
      const clamped = clamp(roundToStep(v, range.step), range.min, range.max)
      return { value: clamped, min: range.min, max: range.max, step: range.step }
    },
    handler: (store, { value, min, max, step }) => ({
      ...store,
      entities: {
        ...store.entities,
        [VALUE_ID]: { id: VALUE_ID, value, min, max, step },
      },
    }),
  },

  increment: {
    type: 'core:increment-value' as const,
    create: (step: number, range: ValueRange) => ({ step, min: range.min, max: range.max, rangeStep: range.step }),
    handler: (store, { step, min, max, rangeStep }) => {
      const current = ((store.entities[VALUE_ID] as Record<string, unknown>)?.value as number) ?? min
      const next = clamp(roundToStep(current + step, rangeStep), min, max)
      return {
        ...store,
        entities: {
          ...store.entities,
          [VALUE_ID]: { id: VALUE_ID, value: next, min, max, step: rangeStep },
        },
      }
    },
  },
})

/** Composed: defineCommands + sugar delegators */
export const valueCommands = {
  ..._valueCommands,
  /** Sugar: decrement = increment(-step, range) */
  decrement: (step: number, range: ValueRange): Command => _valueCommands.increment(-step, range),
}

// ② 2026-03-29-ctx-axis-namespace-prd.md
export function valueCtx(
  engine: import('../engine/createCommandEngine').CommandEngine,
  _focusedId: string,
  range: ValueRange,
): import('./types').ValueNav {
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



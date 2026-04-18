var e=`import type { Command } from '../engine/types'
import { defineCommands } from '../engine/defineCommand'

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
`;export{e as default};
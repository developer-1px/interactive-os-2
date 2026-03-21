import type { Entity } from '../core/types'
import type { NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { value } from '../axes/value'

interface SpinbuttonOptions {
  min: number
  max: number
  step: number
}

export function spinbutton(options: SpinbuttonOptions) {
  const { min, max, step } = options

  return composePattern(
    {
      role: 'none',
      childRole: 'spinbutton',
      ariaAttributes: (_node: Entity, state: NodeState) => ({
        'aria-valuenow': String(state.valueCurrent ?? min),
        'aria-valuemin': String(min),
        'aria-valuemax': String(max),
      }),
    },
    value({ min, max, step, orientation: 'vertical' }),
  )
}

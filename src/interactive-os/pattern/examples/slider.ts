import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { value } from '../../axis/value'

interface SliderOptions {
  min: number
  max: number
  step: number
}

export function slider(options: SliderOptions) {
  const { min, max, step } = options

  return composePattern(
    {
      role: 'none',
      childRole: 'slider',
      ariaAttributes: (node: Entity, state: NodeState) => ({
        'aria-valuenow': String(state.valueCurrent ?? min),
        'aria-valuemin': String(min),
        'aria-valuemax': String(max),
        ...((node.data as Record<string, unknown>)?.label
          ? { 'aria-label': String((node.data as Record<string, unknown>).label) }
          : {}),
      }),
    },
    value({ min, max, step, orientation: 'horizontal' }),
  )
}

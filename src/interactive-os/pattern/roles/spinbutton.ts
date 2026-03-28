import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { incrementHandler, decrementHandler, incrementBig, decrementBig, setToMin, setToMax } from '../../axis/value'

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
      valueRange: { min, max, step },
      ariaAttributes: (node: Entity, state: NodeState) => ({
        'aria-valuenow': String(state.valueCurrent ?? min),
        'aria-valuemin': String(min),
        'aria-valuemax': String(max),
        ...((node.data as Record<string, unknown>)?.label
          ? { 'aria-label': String((node.data as Record<string, unknown>).label) }
          : {}),
      }),
    },
    {
      ArrowUp: incrementHandler,
      ArrowDown: decrementHandler,
      Home: setToMin,
      End: setToMax,
      PageUp: incrementBig,
      PageDown: decrementBig,
    },
  )
}

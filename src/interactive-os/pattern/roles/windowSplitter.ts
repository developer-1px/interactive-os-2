// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Pattern: Window Splitter
 * https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
 */
import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { incrementHandler, decrementHandler, setToMin, setToMax } from '../../axis/value'

interface WindowSplitterOptions {
  min: number
  max: number
  step: number
  orientation?: 'horizontal' | 'vertical'
}

export function windowSplitter(options: WindowSplitterOptions) {
  const { min, max, step, orientation = 'horizontal' } = options

  return composePattern(
    {
      role: 'none',
      childRole: 'separator',
      focusStrategy: { type: 'roving-tabindex', orientation },
      valueRange: { min, max, step },
      ariaAttributes: (node: Entity, state: NodeState) => ({
        'aria-valuenow': String(state.valueCurrent ?? min),
        'aria-valuemin': String(min),
        'aria-valuemax': String(max),
        'aria-orientation': orientation,
        ...((node.data as Record<string, unknown>)?.label
          ? { 'aria-label': String((node.data as Record<string, unknown>).label) }
          : {}),
      }),
    },
    {
      ...(orientation === 'horizontal'
        ? { ArrowRight: incrementHandler, ArrowLeft: decrementHandler }
        : { ArrowUp: incrementHandler, ArrowDown: decrementHandler }),
      Home: setToMin,
      End: setToMax,
    },
  )
}

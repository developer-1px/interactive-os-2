// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Pattern: Window Splitter
 * https://www.w3.org/WAI/ARIA/apg/patterns/windowsplitter/
 *
 * A window splitter is a movable separator between two panels.
 * Uses the value axis to handle Arrow/Home/End key interactions.
 */
import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { value } from '../../axis/value'

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
    value({ min, max, step, orientation }),
  )
}

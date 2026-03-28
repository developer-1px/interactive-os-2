import type { AriaPattern, NodeState } from '../types'
import { composePattern } from '../composePattern'
import { select } from '../../axis/select'
import { navigate } from '../../axis/navigate'

export function grid(options: { columns: number; tabCycle?: boolean }): AriaPattern {
  return composePattern(
    {
      role: 'grid',
      childRole: 'row',
      ariaAttributes: (_node, state: NodeState) => ({
        'aria-rowindex': String(state.index + 1),
        'aria-selected': String(state.selected),
      }),
    },
    select(),
    navigate({ grid: { columns: options.columns, tabCycle: options.tabCycle } }),
  )
}

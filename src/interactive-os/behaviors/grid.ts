import type { AriaBehavior, NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { select } from '../axes/select'
import { navigate } from '../axes/navigate'

export function grid(options: { columns: number; tabCycle?: boolean }): AriaBehavior {
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

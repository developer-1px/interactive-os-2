import type { AriaBehavior, NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { selectToggle } from '../axes/selectToggle'
import { navGrid } from '../axes/navGrid'

export function grid(options: { columns: number }): AriaBehavior {
  return composePattern(
    {
      role: 'grid',
      childRole: 'row',
      colCount: options.columns,
      focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
      ariaAttributes: (_node, state: NodeState) => ({
        'aria-rowindex': String(state.index + 1),
        'aria-selected': String(state.selected),
      }),
    },
    selectToggle,
    navGrid(),
  )
}

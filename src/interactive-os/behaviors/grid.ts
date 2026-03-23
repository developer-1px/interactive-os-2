import type { AriaBehavior, NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { select } from '../axes/select'
import { navigate } from '../axes/navigate'
import { edit as editAxis } from '../axes/edit'

export function grid(options: { columns: number; tabCycle?: boolean; edit?: boolean }): AriaBehavior {
  const axes = [
    select(),
    navigate({ grid: { columns: options.columns, tabCycle: options.tabCycle } }),
  ]
  if (options.edit) {
    axes.push(editAxis())
  }
  return composePattern(
    {
      role: 'grid',
      childRole: 'row',
      ariaAttributes: (_node, state: NodeState) => ({
        'aria-rowindex': String(state.index + 1),
        'aria-selected': String(state.selected),
      }),
    },
    ...axes,
  )
}

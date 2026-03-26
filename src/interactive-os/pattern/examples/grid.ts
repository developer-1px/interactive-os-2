import type { AriaPattern, NodeState } from './types'
import type { Axis } from './composePattern'
import { composePattern } from './composePattern'
import { select } from '../axis/select'
import { navigate } from '../axis/navigate'
import { edit as editAxis } from '../plugins/edit'

export function grid(options: { columns: number; tabCycle?: boolean; edit?: boolean }): AriaPattern {
  const axes: Axis[] = [
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

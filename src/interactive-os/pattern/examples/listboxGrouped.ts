// ② 2026-03-28-checked-axis-childrole-prd.md
import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { navigate } from '../../axis/navigate'
import { select } from '../../axis/select'
import { activate } from '../../axis/activate'
import { expand } from '../../axis/expand'

// APG Listbox with Grouped Options
// Groups at level 1 (role="group"), options at level 2+ (role="option")
export const listboxGrouped = composePattern(
  {
    role: 'listbox',
    childRole: (_entity: Entity, state: NodeState) =>
      (state.level ?? 1) === 1 ? 'group' : 'option',
    ariaAttributes: (_node: Entity, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
  },
  navigate({ wrap: true }),
  select({ mode: 'single' }),
  activate({ onClick: true }),
  expand(),
)

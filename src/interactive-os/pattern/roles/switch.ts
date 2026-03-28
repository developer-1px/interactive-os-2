import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { toggleCheckHandler } from '../../axis/checked'

// ② 2026-03-28-checked-axis-childrole-prd.md
export const switchPattern = composePattern(
  {
    role: 'switch',
    childRole: 'switch',
    checkedTracking: true,
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.checked ?? false),
    }),
  },
  {
    Enter: toggleCheckHandler,
    Space: toggleCheckHandler,
    Click: toggleCheckHandler,
  },
)

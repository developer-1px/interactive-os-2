import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { checked } from '../../axis/checked'

// ② 2026-03-28-checked-axis-childrole-prd.md
// APG Checkbox (Two-State): Space/Enter toggles, Tab navigates (natural tab order)
// No arrow key navigation — each checkbox is an independent tab stop
export const checkbox = composePattern(
  {
    role: 'group',
    childRole: 'checkbox',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.checked ?? false),
    }),
  },
  checked(),
)

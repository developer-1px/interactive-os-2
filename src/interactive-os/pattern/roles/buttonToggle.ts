import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { checked } from '../../axis/checked'

// ② 2026-03-28-checked-axis-childrole-prd.md
// APG Button (toggle): Enter/Space toggles aria-pressed
// Natural tab order — no arrow key navigation between buttons
export const buttonToggle = composePattern(
  {
    role: 'none',
    childRole: 'button',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-pressed': String(state.checked ?? false),
    }),
  },
  checked(),
)

import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { activate } from '../../axis/activate'

// APG Button (toggle): Enter/Space toggles aria-pressed
// Natural tab order — no arrow key navigation between buttons
export const buttonToggle = composePattern(
  {
    role: 'none',
    childRole: 'button',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-pressed': String(state.expanded ?? false),
    }),
  },
  activate({ onClick: true, toggleExpand: true }),
)

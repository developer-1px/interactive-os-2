import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { activate } from '../../axis/activate'

// APG Checkbox (Two-State): Space toggles, Tab navigates (natural tab order)
// No arrow key navigation — each checkbox is an independent tab stop
export const checkbox = composePattern(
  {
    role: 'group',
    childRole: 'checkbox',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.expanded ?? false),
    }),
  },
  activate({ onClick: true, toggleExpand: true }),
)

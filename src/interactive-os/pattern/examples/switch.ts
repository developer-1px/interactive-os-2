import type { NodeState } from './types'
import { composePattern } from './composePattern'
import { activate } from '../axis/activate'

export const switchPattern = composePattern(
  {
    role: 'switch',
    childRole: 'switch',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.expanded ?? false),
    }),
  },
  activate({ onClick: true, toggleExpand: true }),
)

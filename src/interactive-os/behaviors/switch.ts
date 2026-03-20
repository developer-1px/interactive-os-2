import type { NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { activate } from '../axes/activate'

export const switchBehavior = composePattern(
  {
    role: 'switch',
    childRole: 'switch',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.expanded ?? false),
    }),
  },
  activate({ onClick: true, toggleExpand: true }),
)

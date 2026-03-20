import type { NodeState } from './types'
import { composePattern } from '../axes/compose-pattern'
import { activate } from '../axes/activate'

export const switchBehavior = composePattern(
  {
    role: 'switch',
    childRole: 'switch',
    focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' },
    expandable: true,
    activateOnClick: true,
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.expanded ?? false),
    }),
  },
  activate,
)

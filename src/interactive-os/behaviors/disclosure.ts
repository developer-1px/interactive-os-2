import type { NodeState } from './types'
import { composePattern } from '../axes/compose-pattern'
import { activate } from '../axes/activate'

export const disclosure = composePattern(
  {
    role: 'group',
    childRole: 'button',
    focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' },
    expandable: true,
    activateOnClick: true,
    ariaAttributes: (_node, state: NodeState) => {
      const attrs: Record<string, string> = {}
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      return attrs
    },
  },
  activate,
)

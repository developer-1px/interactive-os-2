import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { dismiss } from '../../axis/dismiss'

export const dialog = composePattern(
  {
    role: 'dialog',
    childRole: 'group',
    ariaAttributes: (_node, state: NodeState) => {
      const attrs: Record<string, string> = {}
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      return attrs
    },
  },
  dismiss(),
)

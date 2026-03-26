import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { dismiss } from '../../axis/dismiss'

export const alertdialog = composePattern(
  {
    role: 'alertdialog',
    childRole: 'group',
    ariaAttributes: (_node, state: NodeState) => {
      const attrs: Record<string, string> = { 'aria-modal': 'true' }
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      return attrs
    },
  },
  dismiss(),
)

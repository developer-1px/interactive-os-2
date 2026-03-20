import type { NodeState } from './types'
import { composePattern } from '../axes/compose-pattern'
import { focusTrap } from '../axes/focus-trap'

export const alertdialog = composePattern(
  {
    role: 'alertdialog',
    childRole: 'group',
    focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' },
    ariaAttributes: (_node, state: NodeState) => {
      const attrs: Record<string, string> = { 'aria-modal': 'true' }
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      return attrs
    },
  },
  focusTrap,
)

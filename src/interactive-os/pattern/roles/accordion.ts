import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { activate } from '../../axis/activate'
import { navigate } from '../../axis/navigate'

export const accordion = composePattern(
  {
    role: 'region',
    childRole: 'heading',
    ariaAttributes: (_node, state: NodeState) => {
      const attrs: Record<string, string> = {}
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      return attrs
    },
    panelRole: 'region',
    panelVisibility: 'expanded',
  },
  activate({ onClick: true, toggleExpand: true }),
  navigate({ orientation: 'vertical' }),
)

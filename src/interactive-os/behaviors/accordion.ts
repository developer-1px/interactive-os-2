import type { NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { activate } from '../axes/activate'
import { navigate } from '../axes/navigate'

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
  },
  activate({ onClick: true, toggleExpand: true }),
  navigate({ orientation: 'vertical' }),
)

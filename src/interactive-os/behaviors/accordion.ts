import type { NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { activate } from '../axes/activate'
import { navV } from '../axes/navV'

export const accordion = composePattern(
  {
    role: 'region',
    childRole: 'heading',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
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
  navV,
)

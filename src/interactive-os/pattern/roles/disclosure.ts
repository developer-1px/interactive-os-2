import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { activateHandler } from '../../axis/activate'

export const disclosure = composePattern(
  {
    role: 'group',
    childRole: 'button',
    ariaAttributes: (_node, state: NodeState) => {
      const attrs: Record<string, string> = {}
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      return attrs
    },
  },
  { keyMap: {}, config: { activateOnClick: true, expandOnParentClick: true, expandable: true } },
  {
    // Activation
    Enter: activateHandler,
    Space: activateHandler,
  },
)

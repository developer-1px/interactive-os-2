import type { NodeState } from '../types'
import type { Entity } from '../../store/types'
import { composePattern } from '../composePattern'
import { activate } from '../../axis/activate'
import { expand } from '../../axis/expand'
import { navigate } from '../../axis/navigate'

export const menu = composePattern(
  {
    role: 'menu',
    childRole: 'menuitem',
    ariaAttributes: (_node: Entity, state: NodeState) => {
      const attrs: Record<string, string> = {}
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      return attrs
    },
  },
  activate({ onClick: true }),
  expand({ mode: 'arrow' }),
  navigate({ orientation: 'vertical', wrap: true }),
)

import type { NodeState } from './types'
import type { Entity } from '../core/types'
import { composePattern } from '../axes/composePattern'
import { activate } from '../axes/activate'
import { expand } from '../axes/expand'
import { navigate } from '../axes/navigate'

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
  navigate({ orientation: 'vertical' }),
)

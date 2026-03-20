import type { NodeState } from './types'
import type { Entity } from '../core/types'
import { composePattern } from '../axes/compose-pattern'
import { activate } from '../axes/activate'
import { depthArrow } from '../axes/depth-arrow'
import { navV } from '../axes/nav-v'

export const menu = composePattern(
  {
    role: 'menu',
    childRole: 'menuitem',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    activateOnClick: true,
    ariaAttributes: (_node: Entity, state: NodeState) => {
      const attrs: Record<string, string> = {}
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      return attrs
    },
  },
  activate,
  depthArrow,
  navV,
)

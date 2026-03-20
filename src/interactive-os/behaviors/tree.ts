import type { NodeState } from './types'
import type { Entity } from '../core/types'
import { composePattern } from '../axes/compose-pattern'
import { selectExtended } from '../axes/select-extended'
import { selectToggle } from '../axes/select-toggle'
import { activate } from '../axes/activate'
import { depthArrow } from '../axes/depth-arrow'
import { navV } from '../axes/nav-v'

export const tree = composePattern(
  {
    role: 'tree',
    childRole: 'treeitem',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    ariaAttributes: (_node: Entity, state: NodeState) => {
      const attrs: Record<string, string> = {
        'aria-selected': String(state.selected),
        'aria-posinset': String(state.index + 1),
        'aria-setsize': String(state.siblingCount),
      }
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      if (state.level !== undefined) {
        attrs['aria-level'] = String(state.level)
      }
      return attrs
    },
  },
  selectExtended,
  selectToggle,
  activate,
  depthArrow,
  navV,
)

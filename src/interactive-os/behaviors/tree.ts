import type { NodeState } from './types'
import type { Entity } from '../core/types'
import { composePattern } from '../axes/composePattern'
import { selectExtended } from '../axes/selectExtended'
import { selectToggle } from '../axes/selectToggle'
import { activate } from '../axes/activate'
import { depthArrow } from '../axes/depthArrow'
import { navV } from '../axes/navV'

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

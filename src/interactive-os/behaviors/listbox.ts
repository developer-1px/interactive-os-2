import type { NodeState } from './types'
import type { Entity } from '../core/types'
import { composePattern } from '../axes/composePattern'
import { selectExtended } from '../axes/selectExtended'
import { selectToggle } from '../axes/selectToggle'
import { activate } from '../axes/activate'
import { navV } from '../axes/navV'

export const listbox = composePattern(
  {
    role: 'listbox',
    childRole: 'option',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    activateOnClick: true,
    ariaAttributes: (_node: Entity, state: NodeState) => {
      const attrs: Record<string, string> = {
        'aria-selected': String(state.selected),
        'aria-posinset': String(state.index + 1),
        'aria-setsize': String(state.siblingCount),
      }
      return attrs
    },
  },
  selectExtended,
  selectToggle,
  activate,
  navV,
)

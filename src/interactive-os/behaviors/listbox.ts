import type { NodeState } from './types'
import type { Entity } from '../core/types'
import { composePattern } from '../axes/compose-pattern'
import { selectExtended } from '../axes/select-extended'
import { selectToggle } from '../axes/select-toggle'
import { activate } from '../axes/activate'
import { navV } from '../axes/nav-v'

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

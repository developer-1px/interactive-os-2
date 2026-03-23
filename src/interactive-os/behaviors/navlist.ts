import type { NodeState } from './types'
import type { Entity } from '../core/types'
import { composePattern } from '../axes/composePattern'
import { activate } from '../axes/activate'
import { navigate } from '../axes/navigate'

const base = composePattern(
  {
    role: 'listbox',
    childRole: 'option',
    ariaAttributes: (_node: Entity, state: NodeState) => ({
      'aria-selected': String(state.focused),
      'aria-posinset': String(state.index + 1),
      'aria-setsize': String(state.siblingCount),
    }),
  },
  activate({ onClick: true, followFocus: true }),
  navigate({ orientation: 'vertical' }),
)

// Remove Space key — NavList is activation-only, Space is for selection (ListBox)
const { Space: _, ...keyMap } = base.keyMap
export const navlist = { ...base, keyMap }

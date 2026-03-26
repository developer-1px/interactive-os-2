import type { NodeState } from './types'
import type { Entity } from '../store/types'
import { composePattern } from './composePattern'
import { activate } from '../axis/activate'
import { navigate } from '../axis/navigate'

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
const { Space: _space, ...keyMap } = base.keyMap
export const navlist = { ...base, keyMap }

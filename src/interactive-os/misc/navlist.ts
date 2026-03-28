import type { NodeState } from '../pattern/types'
import type { Entity } from '../store/types'
import { composePattern } from '../pattern/composePattern'
import { select } from '../axis/select'
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
  select({ mode: 'single', selectionFollowsFocus: true }),
  activate({ onClick: true, activationFollowsSelection: true }),
  navigate({ orientation: 'vertical' }),
)

// Remove Space key — NavList is activation-only, Space is for selection (ListBox)
const { Space: _space, ...keyMap } = base.keyMap
export const navlist = { ...base, keyMap }

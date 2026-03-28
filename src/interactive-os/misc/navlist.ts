import type { NodeState } from '../pattern/types'
import type { Entity } from '../store/types'
import { composePattern } from '../pattern/composePattern'
import { selectConfig } from '../axis/select'
import { activateHandler } from '../axis/activate'
import { focusNext, focusPrev, focusFirst, focusLast } from '../axis/navigate'

const base = composePattern(
  {
    role: 'listbox',
    childRole: 'option',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    ariaAttributes: (_node: Entity, state: NodeState) => ({
      'aria-selected': String(state.focused),
      'aria-posinset': String(state.index + 1),
      'aria-setsize': String(state.siblingCount),
    }),
  },
  selectConfig({ mode: 'single', selectionFollowsFocus: true }),
  { keyMap: {}, config: { activateOnClick: true, activationFollowsSelection: true } },
  {
    ArrowDown: focusNext,
    ArrowUp: focusPrev,
    Home: focusFirst,
    End: focusLast,
    Enter: activateHandler,
    Click: activateHandler,
  },
)

// Remove Space key — NavList is activation-only, Space is for selection (ListBox)
const { Space: _space, ...keyMap } = base.keyMap
export const navlist = { ...base, keyMap }

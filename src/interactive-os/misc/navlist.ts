import { composePattern } from '../pattern/composePattern'
import { selected } from '../axis/select'
import { navigate } from '../axis/navigate'
import { activateHandler } from '../axis/activate'

const nav = navigate('vertical')
const sel = selected('single', { followFocus: true })

const base = composePattern(
  { role: 'listbox', childRole: 'option' },
  [nav, sel],
  {
    ArrowDown: nav.next,
    ArrowUp: nav.prev,
    Home: nav.first,
    End: nav.last,
    Enter: activateHandler,
    Click: sel.selectAndAnchor,
  },
)

// Remove Space key — NavList is activation-only
const { Space: _space, ...keyMap } = base.keyMap
export const navlist = { ...base, keyMap }

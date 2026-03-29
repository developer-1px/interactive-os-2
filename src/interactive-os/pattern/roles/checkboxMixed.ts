import type { VisibilityFilter } from '../../engine/types'
import { composePattern } from '../composePattern'
import { checked } from '../../axis/checked'
import { navigate } from '../../axis/navigate'

// APG Checkbox Mixed-State: parent reflects aggregate child state
const alwaysDescendFilter: VisibilityFilter = {
  shouldDescend: () => true,
}

const nav = navigate('vertical')
const chk = checked()

export const checkboxMixed = composePattern(
  { role: 'group', childRole: 'checkbox' },
  [nav, chk, { keyMap: {}, visibilityFilter: alwaysDescendFilter }],
  {
    Enter: chk.toggle,
    Space: chk.toggle,
    Click: chk.toggle,
    ArrowDown: nav.next,
    ArrowUp: nav.prev,
    Home: nav.first,
    End: nav.last,
  },
)

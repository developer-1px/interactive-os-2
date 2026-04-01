import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { selected } from '../../axis/select'
import { navigate } from '../../axis/navigate'
import { activateHandler } from '../../axis/activate'

// APG Listbox — "Presents a list of options and allows a user to select one or more."
const nav = navigate('vertical')
const sel = selected('multiple', { followFocus: true })

export function listbox(): AriaPattern {
  return composePattern(
    { role: 'listbox', childRole: 'option' },
    [nav, sel],
    {
      ArrowDown: nav.next,
      ArrowUp: nav.prev,
      Home: nav.first,
      End: nav.last,
      Space: sel.toggle,
      Enter: activateHandler,
      ...sel.keys,
      ...sel.clickKeys,
    },
  )
}

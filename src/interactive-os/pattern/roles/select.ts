import { composePattern } from '../composePattern'
import { popup } from '../../axis/popup'
import { navigate } from '../../axis/navigate'
import { selected } from '../../axis/select'

// APG Select — "A button that opens a listbox popup for single selection."
const nav = navigate('vertical')
const pop = popup('listbox')
const sel = selected('single', { followFocus: true })

export const select = composePattern(
  {
    role: 'listbox', childRole: 'option',
    triggerKeyMap: { Enter: pop.triggerKeys.Enter, Space: pop.triggerKeys.Space, ArrowDown: pop.triggerKeys.ArrowDown, ArrowUp: pop.triggerKeys.ArrowUp },
    triggerClickMap: { Click: pop.open },
  },
  [nav, sel, pop],
  {
    ArrowDown: pop.openFirstOrFocusNext,
    ArrowUp: pop.openLastOrFocusPrev,
    Home: nav.first,
    End: nav.last,
    Escape: pop.close,
    Enter: pop.close,
    Space: pop.close,
    ...sel.clickKeys,
  },
)

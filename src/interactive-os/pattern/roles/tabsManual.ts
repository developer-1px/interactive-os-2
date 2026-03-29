import { composePattern } from '../composePattern'
import { selected } from '../../axis/select'
import { navigate } from '../../axis/navigate'
// APG Tabs (manual activation) — "selection does NOT follow focus"
// Enter/Space explicitly select (≠ activate). Manual tabs: focus moves freely, selection only on Enter/Space/Click.
const nav = navigate('horizontal')
const sel = selected('single')

export const tabsManual = composePattern(
  { role: 'tablist', childRole: 'tab', panel: 'tabpanel' },
  [nav, sel],
  {
    ArrowRight: nav.next,
    ArrowLeft: nav.prev,
    Home: nav.first,
    End: nav.last,
    Space: sel.selectAndAnchor,
    Enter: sel.selectAndAnchor,
    Click: sel.selectAndAnchor,
  },
)

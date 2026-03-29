import { composePattern } from '../composePattern'
import { selected } from '../../axis/select'
import { navigate } from '../../axis/navigate'
import { activateHandler } from '../../axis/activate'

// APG Tabs (manual activation) — "selection does NOT follow focus"
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
    Space: sel.toggle,
    Enter: activateHandler,
    Click: sel.selectAndAnchor,
  },
)

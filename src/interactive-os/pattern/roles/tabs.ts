import { composePattern } from '../composePattern'
import { selected } from '../../axis/select'
import { navigate } from '../../axis/navigate'
import { activateHandler } from '../../axis/activate'

// APG Tabs — "A set of layered sections of content, known as tab panels."
// Automatic activation: selection follows focus.
const nav = navigate('horizontal')
const sel = selected('single', { followFocus: true })

export const tabs = composePattern(
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

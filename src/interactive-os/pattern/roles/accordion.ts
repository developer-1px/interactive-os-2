import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { expanded } from '../../axis/expand'
import { navigate } from '../../axis/navigate'

// APG Accordion — "Vertically stacked set of interactive headings."
const nav = navigate('natural')
const exp = expanded()

export const accordion: AriaPattern = composePattern(
  { role: 'none', childRole: 'heading', panel: 'region' },
  [nav, exp],
  {
    Enter: exp.toggle,
    Space: exp.toggle,
    ArrowDown: nav.next,
    ArrowUp: nav.prev,
    Home: nav.first,
    End: nav.last,
    Click: exp.toggle,
  },
)

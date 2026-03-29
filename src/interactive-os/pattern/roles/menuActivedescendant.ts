import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { expanded } from '../../axis/expand'
import { navigate } from '../../axis/navigate'
import { activateHandler } from '../../axis/activate'

// APG Menu (aria-activedescendant variant)
const nav = navigate('activedescendant')
const exp = expanded()

export const menuActivedescendant: AriaPattern = composePattern(
  { role: 'menu', childRole: 'menuitem' },
  [nav, exp],
  {
    ArrowDown: nav.nextWrap,
    ArrowUp: nav.prevWrap,
    Home: nav.first,
    End: nav.last,
    ArrowRight: exp.expandOrFocusChild,
    ArrowLeft: exp.collapseOrFocusParent,
    Enter: activateHandler,
    Space: activateHandler,
    Escape: exp.collapse,
    Click: activateHandler,
  },
)

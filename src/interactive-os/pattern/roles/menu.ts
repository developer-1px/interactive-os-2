import { composePattern } from '../composePattern'
import { expanded } from '../../axis/expand'
import { navigate } from '../../axis/navigate'
import { activateHandler } from '../../axis/activate'

// APG Menu — "A widget that offers a list of choices to the user."
const nav = navigate('vertical')
const exp = expanded()

export const menu = composePattern(
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

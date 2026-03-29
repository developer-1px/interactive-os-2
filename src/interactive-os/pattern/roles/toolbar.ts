import { composePattern } from '../composePattern'
import { navigate } from '../../axis/navigate'
import { activateHandler } from '../../axis/activate'

// APG Toolbar — "A container for grouping a set of controls."
const nav = navigate('horizontal')

export const toolbar = composePattern(
  { role: 'toolbar', childRole: 'button' },
  [nav],
  {
    ArrowRight: nav.nextWrap,
    ArrowLeft: nav.prevWrap,
    Home: nav.first,
    End: nav.last,
    Enter: activateHandler,
    Space: activateHandler,
    Click: activateHandler,
  },
)

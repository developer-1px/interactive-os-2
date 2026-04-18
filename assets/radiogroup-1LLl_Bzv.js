var e=`import { composePattern } from '../composePattern'
import { selected } from '../../axis/select'
import { navigate } from '../../axis/navigate'
import { activateHandler } from '../../axis/activate'

// APG Radio Group — "Only one radio button in a group can be checked at a time."
// selection follows focus, all arrows wrap
const nav = navigate('both')
const sel = selected('single', { followFocus: true })

export const radiogroup = composePattern(
  { role: 'radiogroup', childRole: 'radio' },
  [nav, sel],
  {
    ArrowDown: nav.nextWrap,
    ArrowUp: nav.prevWrap,
    ArrowRight: nav.nextWrap,
    ArrowLeft: nav.prevWrap,
    Space: sel.toggle,
    Enter: activateHandler,
    Click: sel.selectAndAnchor,
  },
)
`;export{e as default};
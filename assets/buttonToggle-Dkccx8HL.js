var e=`import { composePattern } from '../composePattern'
import { checked } from '../../axis/checked'
import { navigate } from '../../axis/navigate'

// APG Button (toggle) — Enter/Space toggles aria-pressed
const nav = navigate('natural')
const chk = checked()

export const buttonToggle = composePattern(
  { role: 'none', childRole: 'button' },
  [nav, chk],
  {
    Enter: chk.toggle,
    Space: chk.toggle,
    Click: chk.toggle,
  },
)
`;export{e as default};
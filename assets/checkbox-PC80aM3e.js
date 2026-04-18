var e=`import { composePattern } from '../composePattern'
import { checked } from '../../axis/checked'
import { navigate } from '../../axis/navigate'

// APG Checkbox — Space/Enter toggles, Tab navigates (natural tab order)
const nav = navigate('natural')
const chk = checked()

export const checkbox = composePattern(
  { role: 'group', childRole: 'checkbox' },
  [nav, chk],
  {
    Enter: chk.toggle,
    Space: chk.toggle,
    Click: chk.toggle,
  },
)
`;export{e as default};
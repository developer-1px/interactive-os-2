import { composePattern } from '../composePattern'
import { checked } from '../../axis/checked'
import { navigate } from '../../axis/navigate'

// APG Switch — "A type of checkbox that represents on/off values."
const nav = navigate('natural')
const chk = checked()

export const switchPattern = composePattern(
  { role: 'switch', childRole: 'switch' },
  [nav, chk],
  {
    Enter: chk.toggle,
    Space: chk.toggle,
    Click: chk.toggle,
  },
)

import { composePattern } from '../composePattern'
import { expanded } from '../../axis/expand'
import { navigate } from '../../axis/navigate'

// APG Disclosure — "Enables content to be either collapsed or expanded."
const nav = navigate('natural')
const exp = expanded()

export const disclosure = composePattern(
  { role: 'group', childRole: 'button' },
  [nav, exp],
  {
    Enter: exp.toggle,
    Space: exp.toggle,
    Click: exp.toggle,
  },
)

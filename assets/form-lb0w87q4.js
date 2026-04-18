var e=`// ② form-pattern-detail-panel-prd.md
import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { expanded } from '../../axis/expand'
import { navigate } from '../../axis/navigate'

// Form pattern — Tab-navigated groups with expandable sections.
// No Arrow key bindings (F4); Tab order is browser-native.
const nav = navigate('natural')
const exp = expanded()

export const form: AriaPattern = composePattern(
  { role: 'form', childRole: 'group' },
  [nav, exp],
  {
    Enter: exp.toggle,
    Space: exp.toggle,
    Click: exp.toggle,
  },
)
`;export{e as default};
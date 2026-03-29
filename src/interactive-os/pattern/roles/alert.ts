import { composePattern } from '../composePattern'
import { navigate } from '../../axis/navigate'

// APG Alert — role="alert" live region. No keyboard interaction.
export const alert = composePattern(
  { role: 'none', childRole: 'alert' },
  [navigate('natural')],
  {},
)

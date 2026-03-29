import { composePattern } from '../composePattern'
import { navigate } from '../../axis/navigate'

// APG Meter — display-only value indicator. No keyboard interaction.
export const meter = composePattern(
  { role: 'none', childRole: 'meter' },
  [navigate('natural')],
  {},
)

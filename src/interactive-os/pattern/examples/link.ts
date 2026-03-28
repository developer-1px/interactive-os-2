import { composePattern } from '../composePattern'
import { activate } from '../../axis/activate'

// APG Link: Enter activates. Natural tab order.
export const link = composePattern(
  {
    role: 'none',
    childRole: 'link',
    ariaAttributes: () => ({}),
  },
  activate({ onClick: true }),
)

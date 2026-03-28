import { composePattern } from '../composePattern'
import { activateHandler } from '../../axis/activate'

// APG Link: Enter activates. Natural tab order.
export const link = composePattern(
  {
    role: 'none',
    childRole: 'link',
    ariaAttributes: () => ({}),
  },
  {
    Enter: activateHandler,
    Space: activateHandler,
    Click: activateHandler,
  },
)

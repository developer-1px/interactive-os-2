var e=`import { composePattern } from '../composePattern'
import { navigate } from '../../axis/navigate'
import { activateHandler } from '../../axis/activate'

// APG Link — Enter activates. Natural tab order.
const nav = navigate('natural')

export const link = composePattern(
  { role: 'none', childRole: 'link' },
  [nav],
  {
    Enter: activateHandler,
    Space: activateHandler,
    Click: activateHandler,
  },
)
`;export{e as default};
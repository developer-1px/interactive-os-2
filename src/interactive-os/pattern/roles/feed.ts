import { composePattern } from '../composePattern'
import { navigate } from '../../axis/navigate'

// APG Feed — "A section that automatically loads new content as the user scrolls."
const nav = navigate('vertical')

export const feed = composePattern(
  { role: 'feed', childRole: 'article' },
  [nav],
  {
    PageDown: nav.next,
    PageUp: nav.prev,
  },
)

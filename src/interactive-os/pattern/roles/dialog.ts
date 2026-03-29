import { composePattern } from '../composePattern'
import { popup } from '../../axis/popup'
import { navigate } from '../../axis/navigate'

// APG Dialog (Modal) — "A window overlaid on the primary window."
const nav = navigate('natural')
const pop = popup('dialog', { modal: true })

export const dialog = composePattern(
  { role: 'dialog', childRole: 'group' },
  [nav, pop],
  {
    Escape: pop.close,
  },
)

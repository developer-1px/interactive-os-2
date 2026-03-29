import { composePattern } from '../composePattern'
import { popup } from '../../axis/popup'
import { navigate } from '../../axis/navigate'

// APG Alert Dialog — "A dialog that interrupts the user's workflow."
const nav = navigate('natural')
const pop = popup('dialog', { modal: true })

export const alertdialog = composePattern(
  { role: 'alertdialog', childRole: 'group' },
  [nav, pop],
  {
    Escape: pop.close,
  },
)

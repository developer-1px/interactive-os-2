var e=`import { composePattern } from '../composePattern'
import { popup } from '../../axis/popup'
import { navigate } from '../../axis/navigate'
import { key } from '../../axis/types'

// ② 2026-04-06-modal-key-trap-prd.md
// APG Alert Dialog — "A dialog that interrupts the user's workflow."
const nav = navigate('natural')
const pop = popup('dialog', { modal: true })

/** Trap unhandled keys so they don't leak to outer AriaRoute/Aria zones. */
const trap = key(['core:trap'], () => ({ type: 'core:trap', payload: {} }))

export const alertdialog = composePattern(
  { role: 'alertdialog', childRole: 'group' },
  [nav, pop],
  {
    Escape: pop.close,
  },
  { fallbackKey: trap },
)
`;export{e as default};
var e=`// ② 2026-03-29-compose-pattern-3arg-prd.md
import { composePattern } from '../composePattern'
import { popup } from '../../axis/popup'
import { navigate } from '../../axis/navigate'

// APG Menu Button — "A button that opens a menu."
const nav = navigate('vertical')
const pop = popup('menu')

// ② 2026-03-28-aria-panel-trigger-prd.md
export const menuButton = composePattern(
  {
    role: 'menu', childRole: 'menuitem',
    triggerKeyMap: { Enter: pop.triggerKeys.Enter, Space: pop.triggerKeys.Space, ArrowDown: pop.triggerKeys.ArrowDown },
    triggerClickMap: { Click: pop.open },
  },
  [nav, pop],
  {
    ArrowDown: pop.openFirstOrFocusNext,
    ArrowUp: pop.openLastOrFocusPrev,
    Home: nav.first,
    End: nav.last,
    Escape: pop.close,
    Enter: pop.openOrActivate,
    Space: pop.openOrActivate,
  },
)
`;export{e as default};
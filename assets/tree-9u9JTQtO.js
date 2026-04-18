var e=`import { composePattern } from '../composePattern'
import { selected } from '../../axis/select'
import { expanded } from '../../axis/expand'
import { navigate } from '../../axis/navigate'
import { activateHandler } from '../../axis/activate'

// APG Tree View — "A hierarchical list."
const nav = navigate('vertical')
const sel = selected('multiple', { followFocus: true })
const exp = expanded()

export const tree = composePattern(
  { role: 'tree', childRole: 'treeitem' },
  [nav, sel, exp],
  {
    ArrowDown: nav.next,
    ArrowUp: nav.prev,
    ArrowRight: exp.expandOrFocusChild,
    ArrowLeft: exp.collapseOrFocusParent,
    Home: nav.first,
    End: nav.last,
    Space: sel.toggle,
    Enter: activateHandler,
    '*': exp.expandSiblings,
    'Mod+ArrowRight': exp.expandDescendants,
    ...sel.keys,
    ...sel.clickKeys,
  },
)
`;export{e as default};
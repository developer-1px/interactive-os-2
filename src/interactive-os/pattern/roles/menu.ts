import { composePattern } from '../composePattern'
import { expanded } from '../../axis/expand'
import { navigate } from '../../axis/navigate'
import { key } from '../../axis/types'

// APG Menu — "A widget that offers a list of choices to the user."
// Enter/Space/Click: parent → expand submenu, leaf → activate action
const nav = navigate('vertical')
const exp = expanded()

const expandOrActivate = key(['core:expand', 'core:activate'], (ctx) =>
  ctx.getChildren(ctx.focused).length > 0 ? ctx.expanded!.set(true) : ctx.activate())

export const menu = composePattern(
  { role: 'menu', childRole: 'menuitem' },
  [nav, exp],
  {
    ArrowDown: nav.nextWrap,
    ArrowUp: nav.prevWrap,
    Home: nav.first,
    End: nav.last,
    ArrowRight: exp.expandOrFocusChild,
    ArrowLeft: exp.collapseOrFocusParent,
    Enter: expandOrActivate,
    Space: expandOrActivate,
    Escape: exp.collapse,
    Click: expandOrActivate,
  },
)

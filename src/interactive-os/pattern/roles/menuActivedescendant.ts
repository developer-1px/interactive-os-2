import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { expanded } from '../../axis/expand'
import { navigate } from '../../axis/navigate'
import { key } from '../../axis/types'

// APG Menu (aria-activedescendant variant)
// Enter/Space/Click: parent → expand submenu, leaf → activate action
const nav = navigate('activedescendant')
const exp = expanded()

const expandOrActivate = key(['core:expand', 'core:activate'], (ctx) =>
  ctx.getChildren(ctx.focused).length > 0 ? ctx.expanded!.set(true) : ctx.activate())

export const menuActivedescendant: AriaPattern = composePattern(
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

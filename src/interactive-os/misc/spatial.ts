import type { AriaPattern } from '../pattern/types'
import type { PatternContext } from '../axis/types'
import { ROOT_ID } from '../store/types'
import { SPATIAL_PARENT_ID } from '../plugins/spatial'
import { navigate, focusCommands } from '../axis/navigate'
import { composePattern } from '../pattern/composePattern'
import { selected } from '../axis/select'
import { expanded } from '../axis/expand'

// Re-export spatial plugin for consumers that use this pattern
export { spatial as spatialPlugin } from '../plugins/spatial'

const nav = navigate('both')
const sel = selected('multiple')
const exp = expanded()

export const spatial: AriaPattern = composePattern(
  { role: 'group', childRole: 'group' },
  [nav, sel, exp],
  {
    ArrowDown: nav.next,
    ArrowUp: nav.prev,

    Enter: (ctx: PatternContext) => ctx.activate(),
    Escape: (ctx: PatternContext) => (ctx.expanded?.is ? ctx.expanded.set(false) : ctx.focusParent()),

    Space: sel.toggle,
    ...sel.keys,
    ...sel.clickKeys,

    Home: (ctx: PatternContext) => {
      const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
      const depthParentId = (spatialParent?.parentId as string) ?? ROOT_ID
      const siblings = ctx.getChildren(depthParentId)
      if (siblings.length > 0) return focusCommands.setFocus(siblings[0]!)
      return ctx.focusFirst()
    },
    End: (ctx: PatternContext) => {
      const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
      const depthParentId = (spatialParent?.parentId as string) ?? ROOT_ID
      const siblings = ctx.getChildren(depthParentId)
      if (siblings.length > 0) return focusCommands.setFocus(siblings[siblings.length - 1]!)
      return ctx.focusLast()
    },
  },
)

import type { AriaPattern, NodeState } from '../pattern/types'
import type { PatternContext } from '../axis/types'
import { ROOT_ID } from '../store/types'
import { SPATIAL_PARENT_ID } from '../plugins/spatial'
import { focusCommands } from '../axis/navigate'
import { composePattern } from '../pattern/composePattern'
import type { Axis } from '../pattern/composePattern'
import { select } from '../axis/select'
import { activate } from '../axis/activate'
import { expand } from '../axis/expand'

// Re-export spatial plugin for consumers that use this behavior
export { spatial as spatialPlugin } from '../plugins/spatial'

const spatialNav: Axis = {
  Home: (ctx: PatternContext) => {
    const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
    const depthParentId = (spatialParent?.parentId as string) ?? ROOT_ID
    const siblings = ctx.getChildren(depthParentId)
    if (siblings.length > 0) return focusCommands.setFocus(siblings[0])
  },
  End: (ctx: PatternContext) => {
    const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
    const depthParentId = (spatialParent?.parentId as string) ?? ROOT_ID
    const siblings = ctx.getChildren(depthParentId)
    if (siblings.length > 0) return focusCommands.setFocus(siblings[siblings.length - 1])
  },
}

export const spatial: AriaPattern = composePattern(
  {
    role: 'group',
    childRole: 'group',
    ariaAttributes: (node, state: NodeState) => {
      const d = (node.data ?? {}) as Record<string, string>
      const label = d.name || d.label || d.title || d.value || d.variant || ''
      return {
        'aria-level': String(state.level ?? 1),
        ...(label ? { 'aria-label': label } : {}),
        ...(state.selected ? { 'aria-selected': 'true' } : {}),
      }
    },
  },
  { keyMap: {}, config: { focusStrategy: { type: 'roving-tabindex', orientation: 'both' } } },
  select(),
  expand({ mode: 'enter-esc' }),
  activate({ onClick: true }),
  spatialNav,
)

import type { AriaBehavior, NodeState } from './types'
import { ROOT_ID } from '../core/types'
import { SPATIAL_PARENT_ID } from '../plugins/spatial'
import { focusCommands } from '../plugins/core'
import { renameCommands } from '../plugins/rename'
import { composePattern } from '../axes/composePattern'
import type { Axis } from '../axes/composePattern'
import { select } from '../axes/select'
import { activate } from '../axes/activate'
import { expand } from '../axes/expand'

const spatialNav: Axis = {
  F2: (ctx) => renameCommands.startRename(ctx.focused),
  Home: (ctx) => {
    const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
    const depthParentId = (spatialParent?.parentId as string) ?? ROOT_ID
    const siblings = ctx.getChildren(depthParentId)
    if (siblings.length > 0) return focusCommands.setFocus(siblings[0])
  },
  End: (ctx) => {
    const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
    const depthParentId = (spatialParent?.parentId as string) ?? ROOT_ID
    const siblings = ctx.getChildren(depthParentId)
    if (siblings.length > 0) return focusCommands.setFocus(siblings[siblings.length - 1])
  },
}

export const spatial: AriaBehavior = composePattern(
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
  activate({ onClick: true }),
  expand({ mode: 'enter-esc' }),
  spatialNav,
)

import type { AriaBehavior, NodeState } from './types'
import { ROOT_ID } from '../core/types'
import { SPATIAL_PARENT_ID } from '../plugins/spatial'
import { focusCommands } from '../plugins/core'
import { renameCommands } from '../plugins/rename'
import { composePattern } from '../axes/composePattern'
import type { Axis } from '../axes/composePattern'
import { selectToggle } from '../axes/selectToggle'
import { depthEnterEsc } from '../axes/depthEnterEsc'

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
    focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
    activateOnClick: true,
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
  selectToggle,
  depthEnterEsc,
  spatialNav,
)

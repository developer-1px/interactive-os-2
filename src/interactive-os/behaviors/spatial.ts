import type { AriaBehavior, NodeState } from './types'
import { createBatchCommand } from '../core/types'
import { ROOT_ID } from '../core/types'
import { spatialCommands, SPATIAL_PARENT_ID } from '../plugins/spatial'
import { focusCommands } from '../plugins/core'
import { renameCommands } from '../plugins/rename'

export const spatial: AriaBehavior = {
  role: 'group',
  childRole: 'group',
  keyMap: {
    Enter: (ctx) => {
      const children = ctx.getChildren(ctx.focused)
      if (children.length > 0) {
        return createBatchCommand([
          spatialCommands.enterChild(ctx.focused),
          focusCommands.setFocus(children[0]),
        ])
      }
      return renameCommands.startRename(ctx.focused)
    },
    Escape: (ctx) => {
      const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
      const parentId = spatialParent?.parentId as string | undefined
      if (!parentId || parentId === ROOT_ID) return
      return createBatchCommand([
        spatialCommands.exitToParent(),
        focusCommands.setFocus(parentId),
      ])
    },
    F2: (ctx) => renameCommands.startRename(ctx.focused),
    Space: (ctx) => ctx.toggleSelect(),
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
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
  activateOnClick: true,
  ariaAttributes: (_node, state: NodeState) => ({
    'aria-level': String(state.level ?? 1),
  }),
}

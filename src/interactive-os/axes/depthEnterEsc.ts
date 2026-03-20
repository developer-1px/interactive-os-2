import type { Axis } from './composePattern'
import { createBatchCommand, ROOT_ID } from '../core/types'
import { spatialCommands, SPATIAL_PARENT_ID } from '../plugins/spatial'
import { focusCommands } from '../plugins/core'
import { renameCommands } from '../plugins/rename'

export const depthEnterEsc: Axis = {
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
    if (!parentId || parentId === ROOT_ID) return undefined
    return createBatchCommand([
      spatialCommands.exitToParent(),
      focusCommands.setFocus(parentId),
    ])
  },
}

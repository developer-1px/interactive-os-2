import type { AxisConfig, KeyMap } from './types'
import { createBatchCommand } from '../engine/types'
import { ROOT_ID } from '../store/types'
import { spatialCommands, SPATIAL_PARENT_ID } from '../plugins/spatial'
import { focusCommands } from '../plugins/core'
import { renameCommands } from '../plugins/rename'

interface ExpandOptions {
  mode?: 'arrow' | 'enter-esc'
}

export function expand(options?: ExpandOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const mode = options?.mode ?? 'arrow'

  if (mode === 'enter-esc') {
    const keyMap: KeyMap = {
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
    return { keyMap, config: {} }
  }

  // mode === 'arrow' (default)
  const keyMap: KeyMap = {
    ArrowRight: (ctx) => (ctx.isExpanded ? ctx.focusChild() : ctx.expand()),
    ArrowLeft: (ctx) => (ctx.isExpanded ? ctx.collapse() : ctx.focusParent()),
  }
  return { keyMap, config: {} }
}

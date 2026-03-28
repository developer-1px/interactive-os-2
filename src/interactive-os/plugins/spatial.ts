import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import { getParent } from '../store/createStore'
import { focusCommands } from '../axis/navigate'
import { definePlugin } from './definePlugin'
import type { PatternContext } from '../axis/types'

export const SPATIAL_PARENT_ID = '__spatial_parent__'

export function getSpatialParentId(store: NormalizedData): string {
  return (store.entities[SPATIAL_PARENT_ID]?.parentId as string) ?? ROOT_ID
}

export const spatialCommands = {
  enterChild(nodeId: string): Command {
    return {
      type: 'spatial:enter-child',
      payload: { nodeId },
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [SPATIAL_PARENT_ID]: { id: SPATIAL_PARENT_ID, parentId: nodeId },
          },
        }
      },
    }
  },

  exitToParent(): Command {
    return {
      type: 'spatial:exit-to-parent',
      execute(store) {
        const currentParentId = getSpatialParentId(store)
        if (currentParentId === ROOT_ID) return store

        const grandparent = getParent(store, currentParentId) ?? ROOT_ID

        if (grandparent === ROOT_ID) {
          const { [SPATIAL_PARENT_ID]: _removed, ...rest } = store.entities
          void _removed
          return { ...store, entities: rest }
        }

        return {
          ...store,
          entities: {
            ...store.entities,
            [SPATIAL_PARENT_ID]: { id: SPATIAL_PARENT_ID, parentId: grandparent },
          },
        }
      },
    }
  },
}

// ② 2026-03-26-plugin-keymap-original-prd.md
export function spatial() {
  return definePlugin({
    name: 'spatial',
    keyMap: {
      Enter: (ctx: PatternContext, original?: () => Command | void) => {
        const kids = ctx.getChildren(ctx.focused)
        if (kids.length > 0) {
          return createBatchCommand([
            spatialCommands.enterChild(ctx.focused),
            focusCommands.setFocus(kids[0]!),
          ])
        }
        return original?.()
      },
      Escape: (ctx: PatternContext, original?: () => Command | void) => {
        const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
        const parentId = spatialParent?.parentId as string | undefined
        if (!parentId || parentId === ROOT_ID) return original?.()
        return createBatchCommand([
          spatialCommands.exitToParent(),
          focusCommands.setFocus(parentId),
        ])
      },
    },
  })
}

var e=`import { createBatchCommand } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import { getParent } from '../store/createStore'
import { focusCommands } from '../core'
import { definePlugin } from './definePlugin'
import { key } from '../axis/types'
import { defineCommands } from '../engine/defineCommand'

export const SPATIAL_PARENT_ID = '__spatial_parent__'

export function getSpatialParentId(store: NormalizedData): string {
  return (store.entities[SPATIAL_PARENT_ID]?.parentId as string) ?? ROOT_ID
}

export const spatialCommands = defineCommands({
  enterChild: {
    type: 'spatial:enter-child' as const,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => ({
      ...store,
      entities: {
        ...store.entities,
        [SPATIAL_PARENT_ID]: { id: SPATIAL_PARENT_ID, parentId: nodeId },
      },
    }),
  },

  exitToParent: {
    type: 'spatial:exit-to-parent' as const,
    handler: (store) => {
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
  },
})

// ② 2026-04-06-spatial-click-handler-prd.md
export function spatialClickNavigate(store: NormalizedData, nodeId: string) {
  const targetParent = getParent(store, nodeId) ?? ROOT_ID
  const currentSpatialParent = getSpatialParentId(store)

  if (targetParent === currentSpatialParent) {
    return focusCommands.setFocus(nodeId)
  }
  if (targetParent === ROOT_ID) {
    return createBatchCommand([
      spatialCommands.exitToParent(),
      focusCommands.setFocus(nodeId),
    ])
  }
  return createBatchCommand([
    spatialCommands.enterChild(targetParent),
    focusCommands.setFocus(nodeId),
  ])
}

// ② 2026-03-26-plugin-keymap-original-prd.md
export function spatial() {
  return definePlugin({
    name: 'spatial',
    commands: spatialCommands,
    keyMap: {
      Enter: key(['spatial:enter-child', 'core:focus'], (ctx, original) => {
        const kids = ctx.getChildren(ctx.focused)
        if (kids.length > 0) {
          return createBatchCommand([
            spatialCommands.enterChild(ctx.focused),
            focusCommands.setFocus(kids[0]!),
          ])
        }
        const slotKids = ctx.getSlotChildren(ctx.focused)
        if (slotKids.length > 0) {
          return createBatchCommand([
            spatialCommands.enterChild(ctx.focused),
            focusCommands.setFocus(slotKids[0]!),
          ])
        }
        return original?.()
      }),
      Escape: key(['spatial:exit-to-parent', 'core:focus'], (ctx, original) => {
        const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
        const parentId = spatialParent?.parentId as string | undefined
        if (!parentId || parentId === ROOT_ID) return original?.()
        return createBatchCommand([
          spatialCommands.exitToParent(),
          focusCommands.setFocus(parentId),
        ])
      }),
    },
  })
}
`;export{e as default};
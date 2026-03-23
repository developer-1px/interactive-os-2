import type { Command, NormalizedData } from '../core/types'
import { definePlugin } from '../core/definePlugin'
import { ROOT_ID } from '../core/types'
import { getParent } from '../core/createStore'

export const SPATIAL_PARENT_ID = '__spatial_parent__'

export function getSpatialParentId(store: NormalizedData): string {
  return (store.entities[SPATIAL_PARENT_ID]?.parentId as string) ?? ROOT_ID
}

export const spatialCommands = {
  enterChild(nodeId: string): Command {
    let previousParentId: string | undefined
    return {
      type: 'spatial:enter-child',
      payload: { nodeId },
      execute(store) {
        previousParentId = store.entities[SPATIAL_PARENT_ID]?.parentId as string | undefined
        return {
          ...store,
          entities: {
            ...store.entities,
            [SPATIAL_PARENT_ID]: { id: SPATIAL_PARENT_ID, parentId: nodeId },
          },
        }
      },
      undo(store) {
        if (previousParentId === undefined) {
          const { [SPATIAL_PARENT_ID]: _removed, ...rest } = store.entities
          void _removed
          return { ...store, entities: rest }
        }
        return {
          ...store,
          entities: {
            ...store.entities,
            [SPATIAL_PARENT_ID]: { id: SPATIAL_PARENT_ID, parentId: previousParentId },
          },
        }
      },
    }
  },

  exitToParent(): Command {
    let previousParentId: string | undefined
    return {
      type: 'spatial:exit-to-parent',
      payload: null,
      execute(store) {
        const currentParentId = getSpatialParentId(store)
        if (currentParentId === ROOT_ID) return store

        previousParentId = currentParentId
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
      undo(store) {
        if (previousParentId === undefined) return store
        return {
          ...store,
          entities: {
            ...store.entities,
            [SPATIAL_PARENT_ID]: { id: SPATIAL_PARENT_ID, parentId: previousParentId },
          },
        }
      },
    }
  },
}

export function spatial() {
  return definePlugin({ name: 'spatial' })
}

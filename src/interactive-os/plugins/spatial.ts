import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import { getParent } from '../store/createStore'
import { definePlugin } from './definePlugin'

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

export function spatial() {
  return definePlugin({ name: 'spatial' })
}

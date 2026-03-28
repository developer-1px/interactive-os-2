import { ROOT_ID } from '../store/types'
import { getChildren, getParent, moveNode } from '../store/createStore'
import { definePlugin } from './definePlugin'
import { defineCommands } from '../engine/defineCommand'

export const dndCommands = defineCommands({
  moveUp: {
    type: 'dnd:move-up' as const,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const parentId = getParent(store, nodeId) ?? ROOT_ID
      const siblings = getChildren(store, parentId)
      const index = siblings.indexOf(nodeId)
      if (index <= 0) return store
      return moveNode(store, nodeId, parentId, index - 1)
    },
  },

  moveDown: {
    type: 'dnd:move-down' as const,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const parentId = getParent(store, nodeId) ?? ROOT_ID
      const siblings = getChildren(store, parentId)
      const index = siblings.indexOf(nodeId)
      if (index >= siblings.length - 1) return store
      return moveNode(store, nodeId, parentId, index + 1)
    },
  },

  moveOut: {
    type: 'dnd:move-out' as const,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const originalParentId = getParent(store, nodeId)
      if (!originalParentId || originalParentId === ROOT_ID) return store
      const grandparentId = getParent(store, originalParentId) ?? ROOT_ID
      const parentSiblings = getChildren(store, grandparentId)
      const parentIndex = parentSiblings.indexOf(originalParentId)
      return moveNode(store, nodeId, grandparentId, parentIndex + 1)
    },
  },

  moveIn: {
    type: 'dnd:move-in' as const,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const parentId = getParent(store, nodeId) ?? ROOT_ID
      const siblings = getChildren(store, parentId)
      const index = siblings.indexOf(nodeId)
      if (index <= 0) return store
      const prevSiblingId = siblings[index - 1]!
      return moveNode(store, nodeId, prevSiblingId)
    },
  },

  moveTo: {
    type: 'dnd:move-to' as const,
    create: (nodeId: string, targetParentId: string, index?: number) => ({ nodeId, targetParentId, index }),
    handler: (store, { nodeId, targetParentId, index }) => moveNode(store, nodeId, targetParentId, index),
  },
})

export function dnd() {
  return definePlugin({
    name: 'dnd',
    commands: {
      moveUp: dndCommands.moveUp,
      moveDown: dndCommands.moveDown,
      moveOut: dndCommands.moveOut,
      moveIn: dndCommands.moveIn,
      moveTo: dndCommands.moveTo,
    },
  })
}

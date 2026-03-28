import type { Command } from '../engine/types'
import { ROOT_ID } from '../store/types'
import { getChildren, getParent, moveNode } from '../store/createStore'
import { definePlugin } from './definePlugin'

export const dndCommands = {
  /** Move node up among its siblings (swap with previous) */
  moveUp(nodeId: string): Command {
    return {
      type: 'dnd:move-up',
      payload: { nodeId },
      execute(store) {
        const parentId = getParent(store, nodeId) ?? ROOT_ID
        const siblings = getChildren(store, parentId)
        const index = siblings.indexOf(nodeId)
        if (index <= 0) return store // already first
        return moveNode(store, nodeId, parentId, index - 1)
      },
    }
  },

  /** Move node down among its siblings (swap with next) */
  moveDown(nodeId: string): Command {
    return {
      type: 'dnd:move-down',
      payload: { nodeId },
      execute(store) {
        const parentId = getParent(store, nodeId) ?? ROOT_ID
        const siblings = getChildren(store, parentId)
        const index = siblings.indexOf(nodeId)
        if (index >= siblings.length - 1) return store // already last
        return moveNode(store, nodeId, parentId, index + 1)
      },
    }
  },

  /** Move node out -- to parent's level (after parent in grandparent's children) */
  moveOut(nodeId: string): Command {
    return {
      type: 'dnd:move-out',
      payload: { nodeId },
      execute(store) {
        const originalParentId = getParent(store, nodeId)
        if (!originalParentId || originalParentId === ROOT_ID) return store // already at root

        const grandparentId = getParent(store, originalParentId) ?? ROOT_ID
        const parentSiblings = getChildren(store, grandparentId)
        const parentIndex = parentSiblings.indexOf(originalParentId)

        return moveNode(store, nodeId, grandparentId, parentIndex + 1)
      },
    }
  },

  /** Move node in -- into previous sibling (as last child) */
  moveIn(nodeId: string): Command {
    return {
      type: 'dnd:move-in',
      payload: { nodeId },
      execute(store) {
        const parentId = getParent(store, nodeId) ?? ROOT_ID
        const siblings = getChildren(store, parentId)
        const index = siblings.indexOf(nodeId)
        if (index <= 0) return store // no previous sibling

        const prevSiblingId = siblings[index - 1]!
        return moveNode(store, nodeId, prevSiblingId)
      },
    }
  },

  /** Generic move -- move node to a specific parent at a specific index */
  moveTo(nodeId: string, targetParentId: string, index?: number): Command {
    return {
      type: 'dnd:move-to',
      payload: { nodeId, targetParentId, index },
      execute(store) {
        return moveNode(store, nodeId, targetParentId, index)
      },
    }
  },
}

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

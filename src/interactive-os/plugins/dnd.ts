import type { Command, Plugin } from '../core/types'
import { ROOT_ID } from '../core/types'
import { getChildren, getParent, moveNode } from '../core/createStore'

export const dndCommands = {
  /** Move node up among its siblings (swap with previous) */
  moveUp(nodeId: string): Command {
    let originalIndex: number | null = null
    let parentId: string | null = null

    return {
      type: 'dnd:move-up',
      payload: { nodeId },
      execute(store) {
        parentId = getParent(store, nodeId) ?? ROOT_ID
        const siblings = getChildren(store, parentId)
        originalIndex = siblings.indexOf(nodeId)
        if (originalIndex <= 0) return store // already first
        return moveNode(store, nodeId, parentId, originalIndex - 1)
      },
      undo(store) {
        if (originalIndex === null || parentId === null) return store
        return moveNode(store, nodeId, parentId, originalIndex)
      },
    }
  },

  /** Move node down among its siblings (swap with next) */
  moveDown(nodeId: string): Command {
    let originalIndex: number | null = null
    let parentId: string | null = null

    return {
      type: 'dnd:move-down',
      payload: { nodeId },
      execute(store) {
        parentId = getParent(store, nodeId) ?? ROOT_ID
        const siblings = getChildren(store, parentId)
        originalIndex = siblings.indexOf(nodeId)
        if (originalIndex >= siblings.length - 1) return store // already last
        return moveNode(store, nodeId, parentId, originalIndex + 1)
      },
      undo(store) {
        if (originalIndex === null || parentId === null) return store
        return moveNode(store, nodeId, parentId, originalIndex)
      },
    }
  },

  /** Move node out — to parent's level (after parent in grandparent's children) */
  moveOut(nodeId: string): Command {
    let originalParentId: string | null = null
    let originalIndex: number | null = null

    return {
      type: 'dnd:move-out',
      payload: { nodeId },
      execute(store) {
        originalParentId = getParent(store, nodeId) ?? null
        if (!originalParentId || originalParentId === ROOT_ID) return store // already at root

        const siblings = getChildren(store, originalParentId)
        originalIndex = siblings.indexOf(nodeId)

        const grandparentId = getParent(store, originalParentId) ?? ROOT_ID
        const parentSiblings = getChildren(store, grandparentId)
        const parentIndex = parentSiblings.indexOf(originalParentId)

        return moveNode(store, nodeId, grandparentId, parentIndex + 1)
      },
      undo(store) {
        if (!originalParentId || originalIndex === null) return store
        return moveNode(store, nodeId, originalParentId, originalIndex)
      },
    }
  },

  /** Move node in — into previous sibling (as last child) */
  moveIn(nodeId: string): Command {
    let originalParentId: string | null = null
    let originalIndex: number | null = null

    return {
      type: 'dnd:move-in',
      payload: { nodeId },
      execute(store) {
        originalParentId = getParent(store, nodeId) ?? ROOT_ID
        const siblings = getChildren(store, originalParentId)
        originalIndex = siblings.indexOf(nodeId)
        if (originalIndex <= 0) return store // no previous sibling

        const prevSiblingId = siblings[originalIndex - 1]!
        return moveNode(store, nodeId, prevSiblingId)
      },
      undo(store) {
        if (!originalParentId || originalIndex === null) return store
        return moveNode(store, nodeId, originalParentId, originalIndex)
      },
    }
  },

  /** Generic move — move node to a specific parent at a specific index */
  moveTo(nodeId: string, targetParentId: string, index?: number): Command {
    let originalParentId: string | null = null
    let originalIndex: number | null = null

    return {
      type: 'dnd:move-to',
      payload: { nodeId, targetParentId, index },
      execute(store) {
        originalParentId = getParent(store, nodeId) ?? ROOT_ID
        const siblings = getChildren(store, originalParentId)
        originalIndex = siblings.indexOf(nodeId)
        return moveNode(store, nodeId, targetParentId, index)
      },
      undo(store) {
        if (!originalParentId || originalIndex === null) return store
        return moveNode(store, nodeId, originalParentId, originalIndex)
      },
    }
  },
}

export function dnd(): Plugin {
  return {
    commands: {
      moveUp: dndCommands.moveUp,
      moveDown: dndCommands.moveDown,
      moveOut: dndCommands.moveOut,
      moveIn: dndCommands.moveIn,
      moveTo: dndCommands.moveTo,
    },
  }
}

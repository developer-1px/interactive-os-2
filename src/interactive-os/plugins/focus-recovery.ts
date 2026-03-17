import type { Command, NormalizedData, Plugin } from '../core/types'
import { ROOT_ID } from '../core/types'
import { getChildren, getParent, getEntity } from '../core/createStore'
import { focusCommands } from './core'

const FOCUS_ID = '__focus__'
const EXPANDED_ID = '__expanded__'

function getFocusedId(store: NormalizedData): string {
  return (store.entities[FOCUS_ID]?.focusedId as string) ?? ''
}

/**
 * A node is visible if it exists AND all ancestors are expanded.
 */
function isVisible(store: NormalizedData, nodeId: string): boolean {
  if (!getEntity(store, nodeId)) return false
  const expandedIds = (store.entities[EXPANDED_ID]?.expandedIds as string[]) ?? []

  let current = nodeId
  while (true) {
    const parentId = getParent(store, current)
    if (!parentId) return false
    if (parentId === ROOT_ID) return true
    if (!expandedIds.includes(parentId)) return false
    current = parentId
  }
}

/**
 * Find the nearest visible ancestor of a node.
 */
function findVisibleAncestor(store: NormalizedData, nodeId: string): string | null {
  let current = nodeId
  while (true) {
    const parentId = getParent(store, current)
    if (!parentId) return null
    if (parentId === ROOT_ID) return null
    if (isVisible(store, parentId)) return parentId
    current = parentId
  }
}

/**
 * Fallback: next visible sibling → prev visible sibling → nearest visible ancestor.
 */
function findFallbackFocus(
  storeBefore: NormalizedData,
  storeAfter: NormalizedData,
  lostNodeId: string
): string | null {
  const parentId = getParent(storeBefore, lostNodeId)
  if (!parentId) return null

  const siblings = getChildren(storeBefore, parentId)
  const idx = siblings.indexOf(lostNodeId)

  // Next sibling
  for (let i = idx + 1; i < siblings.length; i++) {
    if (isVisible(storeAfter, siblings[i]!)) return siblings[i]!
  }

  // Previous sibling
  for (let i = idx - 1; i >= 0; i--) {
    if (isVisible(storeAfter, siblings[i]!)) return siblings[i]!
  }

  // Nearest visible ancestor
  if (parentId !== ROOT_ID) {
    const ancestor = isVisible(storeAfter, parentId)
      ? parentId
      : findVisibleAncestor(storeAfter, parentId)
    if (ancestor) return ancestor
  }

  // Last resort: first root child
  const rootChildren = getChildren(storeAfter, ROOT_ID)
  if (rootChildren.length > 0) return rootChildren[0]!

  return null
}

/**
 * Focus recovery middleware.
 *
 * Single rule: after every command, if focus is not on a visible node, fix it.
 * - New visible node created → focus it
 * - Focus invisible (deleted, collapsed, hidden) → fallback chain
 */
export function focusRecovery(): Plugin {
  return {
    middleware: (next) => (command) => {
      if (command.type === 'core:focus') {
        next(command)
        return
      }

      let storeBefore: NormalizedData | null = null
      let storeAfter: NormalizedData | null = null

      const wrappedCommand: Command = {
        ...command,
        execute(store) {
          storeBefore = store
          const result = command.execute(store)
          storeAfter = result
          return result
        },
      }

      next(wrappedCommand)

      if (!storeBefore || !storeAfter) return
      const before = storeBefore as NormalizedData
      const after = storeAfter as NormalizedData

      // New visible entities → focus the last one
      const beforeIds = new Set(Object.keys(before.entities))
      const newVisibleIds = Object.keys(after.entities).filter(
        (id) => !beforeIds.has(id) && !id.startsWith('__') && isVisible(after, id)
      )

      if (newVisibleIds.length > 0) {
        next(focusCommands.setFocus(newVisibleIds[newVisibleIds.length - 1]!))
        return
      }

      // Current focus not visible → fallback
      const currentFocus = getFocusedId(after) || getFocusedId(before)
      if (currentFocus && !isVisible(after, currentFocus)) {
        const fallback = findFallbackFocus(before, after, currentFocus)
        if (fallback) {
          next(focusCommands.setFocus(fallback))
        }
      }
    },
  }
}

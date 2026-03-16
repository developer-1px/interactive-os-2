import type { Command, NormalizedData, Plugin } from '../core/types'
import { ROOT_ID } from '../core/types'
import { getChildren, getParent, getEntity } from '../core/normalized-store'
import { focusCommands } from './core'

const FOCUS_ID = '__focus__'
const EXPANDED_ID = '__expanded__'

function getFocusedId(store: NormalizedData): string {
  return (store.entities[FOCUS_ID]?.focusedId as string) ?? ''
}

function getExpandedIds(store: NormalizedData): string[] {
  return (store.entities[EXPANDED_ID]?.expandedIds as string[]) ?? []
}

/**
 * Check if a node exists in the store.
 */
function nodeExists(store: NormalizedData, nodeId: string): boolean {
  return !!getEntity(store, nodeId)
}

/**
 * Check if a node is a descendant of a given ancestor.
 */
function isDescendantOf(store: NormalizedData, nodeId: string, ancestorId: string): boolean {
  let current = nodeId
  while (true) {
    const parentId = getParent(store, current)
    if (!parentId || parentId === ROOT_ID) return false
    if (parentId === ancestorId) return true
    current = parentId
  }
}

/**
 * Fallback: next sibling → prev sibling → parent (in storeBefore's structure)
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

  // Next sibling that still exists
  for (let i = idx + 1; i < siblings.length; i++) {
    const candidate = siblings[i]!
    if (candidate !== lostNodeId && nodeExists(storeAfter, candidate)) {
      return candidate
    }
  }

  // Previous sibling that still exists
  for (let i = idx - 1; i >= 0; i--) {
    const candidate = siblings[i]!
    if (candidate !== lostNodeId && nodeExists(storeAfter, candidate)) {
      return candidate
    }
  }

  // Parent (if not root and still exists)
  if (parentId !== ROOT_ID && nodeExists(storeAfter, parentId)) {
    return parentId
  }

  // First root child
  const rootChildren = getChildren(storeAfter, ROOT_ID)
  if (rootChildren.length > 0) return rootChildren[0]!

  return null
}

/**
 * Focus recovery middleware.
 *
 * Policy: "Focus follows the result"
 * - Deleted/gone → next sibling → prev sibling → parent
 * - Collapsed (focused child hidden) → collapsed node (parent)
 * - Created/pasted → new node
 * - Moved → focus stays on same ID (already handled)
 * - Undo restore → restored node
 */
export function focusRecovery(): Plugin {
  return {
    middleware: (next) => (command) => {
      // Skip focus commands to avoid loops
      if (command.type === 'core:focus') {
        next(command)
        return
      }

      // Capture storeBefore and storeAfter
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

      const focusedBefore = getFocusedId(storeBefore)
      const focusedAfter = getFocusedId(storeAfter)
      const currentFocus = focusedAfter || focusedBefore

      if (!currentFocus) return

      // --- Case 1: New entities (create, paste, undo-restore) ---
      const beforeEntityIds = new Set(Object.keys(storeBefore.entities))
      const newEntityIds = Object.keys(storeAfter.entities).filter(
        (id) => !beforeEntityIds.has(id) && !id.startsWith('__')
      )

      if (newEntityIds.length > 0) {
        const target = newEntityIds[newEntityIds.length - 1]!
        if (nodeExists(storeAfter, target)) {
          next(focusCommands.setFocus(target))
          return
        }
      }

      // --- Case 2: Focused node no longer exists → fallback ---
      if (!nodeExists(storeAfter, currentFocus)) {
        const fallback = findFallbackFocus(storeBefore, storeAfter, currentFocus)
        if (fallback) {
          next(focusCommands.setFocus(fallback))
        }
        return
      }

      // --- Case 3: Collapse — focused node is descendant of a just-collapsed node ---
      if (command.type === 'core:collapse' || command.type === 'core:toggle-expand') {
        const expandedBefore = getExpandedIds(storeBefore)
        const expandedAfter = getExpandedIds(storeAfter)

        // Find which node was just collapsed
        const justCollapsed = expandedBefore.filter((id) => !expandedAfter.includes(id))

        for (const collapsedId of justCollapsed) {
          if (isDescendantOf(storeAfter, currentFocus, collapsedId)) {
            next(focusCommands.setFocus(collapsedId))
            return
          }
        }
      }
    },
  }
}

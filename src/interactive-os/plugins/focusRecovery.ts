import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import { getChildren, getParent, getEntity } from '../store/createStore'
import { definePlugin } from './definePlugin'
import { focusCommands } from '../axis/navigate'

const FOCUS_ID = '__focus__'
const EXPANDED_ID = '__expanded__'

export type IsReachable = (store: NormalizedData, nodeId: string) => boolean

/**
 * Spatial reachability: all nodes are always rendered, so reachable = exists.
 * isVisible already guards existence, so this is simply () => true.
 */
export const spatialReachable: IsReachable = () => true

/**
 * Default tree reachability: all ancestors must be expanded.
 */
function treeReachable(store: NormalizedData, nodeId: string): boolean {
  const expandedEntity = store.entities[EXPANDED_ID]
  // No expand tracking → all nodes are reachable (no gating)
  if (!expandedEntity) return getEntity(store, nodeId) != null
  const expandedIds = (expandedEntity.expandedIds as string[]) ?? []

  let current = nodeId
  while (true) {
    const parentId = getParent(store, current)
    if (!parentId) return false
    if (parentId === ROOT_ID) return true
    if (!expandedIds.includes(parentId)) return false
    current = parentId
  }
}

export function getFocusedId(store: NormalizedData): string {
  return (store.entities[FOCUS_ID]?.focusedId as string) ?? ''
}

/**
 * A node is visible if it exists AND is reachable.
 * isReachable defaults to tree model (all ancestors expanded).
 */
export function isVisible(
  store: NormalizedData,
  nodeId: string,
  isReachable: IsReachable = treeReachable
): boolean {
  if (!getEntity(store, nodeId)) return false
  return isReachable(store, nodeId)
}

/**
 * Find the nearest visible ancestor of a node.
 */
function findVisibleAncestor(
  store: NormalizedData,
  nodeId: string,
  isReachable: IsReachable = treeReachable
): string | null {
  let current = nodeId
  while (true) {
    const parentId = getParent(store, current)
    if (!parentId) return null
    if (parentId === ROOT_ID) return null
    if (isVisible(store, parentId, isReachable)) return parentId
    current = parentId
  }
}

/**
 * Fallback: next visible sibling → prev visible sibling → nearest visible ancestor.
 */
export function findFallbackFocus(
  storeBefore: NormalizedData,
  storeAfter: NormalizedData,
  lostNodeId: string,
  isReachable: IsReachable = treeReachable
): string | null {
  const parentId = getParent(storeBefore, lostNodeId)
  if (!parentId) return null

  const siblings = getChildren(storeBefore, parentId)
  const idx = siblings.indexOf(lostNodeId)

  // Next sibling
  for (let i = idx + 1; i < siblings.length; i++) {
    if (isVisible(storeAfter, siblings[i]!, isReachable)) return siblings[i]!
  }

  // Previous sibling
  for (let i = idx - 1; i >= 0; i--) {
    if (isVisible(storeAfter, siblings[i]!, isReachable)) return siblings[i]!
  }

  // Nearest visible ancestor
  if (parentId !== ROOT_ID) {
    const ancestor = isVisible(storeAfter, parentId, isReachable)
      ? parentId
      : findVisibleAncestor(storeAfter, parentId, isReachable)
    if (ancestor) return ancestor
  }

  // Last resort: first root child
  const rootChildren = getChildren(storeAfter, ROOT_ID)
  if (rootChildren.length > 0) return rootChildren[0]!

  return null
}

/**
 * Detect entity IDs that are new and visible in storeAfter compared to storeBefore.
 */
export function detectNewVisibleEntities(
  storeBefore: NormalizedData,
  storeAfter: NormalizedData,
  isReachable: IsReachable = treeReachable
): string[] {
  const beforeIds = new Set(Object.keys(storeBefore.entities))
  return Object.keys(storeAfter.entities).filter(
    (id) => !beforeIds.has(id) && !id.startsWith('__') && isVisible(storeAfter, id, isReachable)
  )
}

export interface FocusRecoveryOptions {
  isReachable?: IsReachable
}

/**
 * Focus recovery middleware.
 *
 * Single rule: after every command, if focus is not on a visible node, fix it.
 * - New visible node created → focus it
 * - Focus invisible (deleted, collapsed, hidden) → fallback chain
 */
export function focusRecovery(options?: FocusRecoveryOptions) {
  const reachable = options?.isReachable ?? treeReachable

  return definePlugin({
    name: 'focusRecovery',
    middleware: (next: (command: Command) => void) => (command: Command) => {
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

      // New visible entities → focus the first one (top-level result)
      const newVisibleIds = detectNewVisibleEntities(before, after, reachable)

      if (newVisibleIds.length > 0) {
        next(focusCommands.setFocus(newVisibleIds[0]!))
        return
      }

      // Current focus not visible → fallback
      const currentFocus = getFocusedId(after) || getFocusedId(before)
      if (currentFocus && !isVisible(after, currentFocus, reachable)) {
        const fallback = findFallbackFocus(before, after, currentFocus, reachable)
        if (fallback) {
          next(focusCommands.setFocus(fallback))
        }
      }
    },
  })
}

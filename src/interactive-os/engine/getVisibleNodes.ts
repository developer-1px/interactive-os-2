import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { getChildren, getSlotChildren } from '../store/createStore'
import type { VisibilityFilter } from './types'

/**
 * Build flat list of visible node IDs by depth-first walk from __root__.
 *
 * Visibility is determined by filters declared by axes/plugins:
 * - shouldShow(nodeId, store) → false = skip this node entirely
 * - shouldDescend(nodeId, store) → false = don't walk children
 *
 * When no filters are provided, all nodes are visible.
 * Container nodes (nodes with children or slots) without expand filter are
 * not focusable — only their children are walked into.
 */
export function getVisibleNodes(store: NormalizedData, filters?: VisibilityFilter[]): string[] {
  const visible: string[] = []
  const hasDescendFilter = filters?.some(f => f.shouldDescend) ?? false

  const visitChild = (childId: string) => {
    if (filters?.some(f => f.shouldShow && !f.shouldShow(childId, store))) return

    const grandChildren = getChildren(store, childId)
    const grandSlots = getSlotChildren(store, childId)
    const isContainer = grandChildren.length > 0 || grandSlots.length > 0

    if (isContainer && !hasDescendFilter) {
      walk(childId)
    } else {
      visible.push(childId)
      const shouldDescend = !filters?.some(f => f.shouldDescend && !f.shouldDescend(childId, store))
      if (shouldDescend) {
        walk(childId)
      }
    }
  }

  const walk = (parentId: string) => {
    for (const childId of getChildren(store, parentId)) visitChild(childId)
    for (const childId of getSlotChildren(store, parentId)) visitChild(childId)
  }

  walk(ROOT_ID)
  return visible
}

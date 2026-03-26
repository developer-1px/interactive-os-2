import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import { getChildren } from '../store/createStore'
import type { VisibilityFilter } from './types'

/**
 * Build flat list of visible node IDs by depth-first walk from __root__.
 *
 * Visibility is determined by filters declared by axes/plugins:
 * - shouldShow(nodeId, store) → false = skip this node entirely
 * - shouldDescend(nodeId, store) → false = don't walk children
 *
 * When no filters are provided, all nodes are visible.
 * Container nodes (nodes with children) without expand filter are
 * not focusable — only their children are walked into.
 */
export function getVisibleNodes(store: NormalizedData, filters?: VisibilityFilter[]): string[] {
  const visible: string[] = []
  const hasDescendFilter = filters?.some(f => f.shouldDescend) ?? false

  const walk = (parentId: string) => {
    const children = getChildren(store, parentId)
    for (const childId of children) {
      // shouldShow: if any filter says no, skip entirely
      if (filters?.some(f => f.shouldShow && !f.shouldShow(childId, store))) {
        continue
      }

      const grandChildren = getChildren(store, childId)
      const isContainer = grandChildren.length > 0

      if (isContainer && !hasDescendFilter) {
        // No descend filter → container nodes (groups) are not focusable, only walk into them
        walk(childId)
      } else {
        visible.push(childId)
        // shouldDescend: if any filter says no, don't walk children
        const shouldDescend = !filters?.some(f => f.shouldDescend && !f.shouldDescend(childId, store))
        if (shouldDescend) {
          walk(childId)
        }
      }
    }
  }

  walk(ROOT_ID)
  return visible
}

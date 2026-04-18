var e=`import { ROOT_ID } from '../store/types'
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
/** Find the first visible (focusable) descendant of a parent node.
 *  Walks children depth-first, skipping isFocusable=false nodes but descending into them. */
export function getFirstVisibleChild(store: NormalizedData, parentId: string, filters?: VisibilityFilter[]): string | undefined {
  const hasFocusable = filters?.some(f => f.isFocusable) ?? false
  if (!hasFocusable) {
    // No isFocusable filter → first child as before
    const kids = getChildren(store, parentId)
    return kids[0] ?? getSlotChildren(store, parentId)[0]
  }

  const isFocusable = (id: string) => !filters?.some(f => f.isFocusable && !f.isFocusable(id, store))

  const walk = (pid: string): string | undefined => {
    for (const childId of getChildren(store, pid)) {
      if (filters?.some(f => f.shouldShow && !f.shouldShow(childId, store))) continue
      if (isFocusable(childId)) return childId
      const deeper = walk(childId)
      if (deeper) return deeper
    }
    for (const childId of getSlotChildren(store, pid)) {
      if (filters?.some(f => f.shouldShow && !f.shouldShow(childId, store))) continue
      if (isFocusable(childId)) return childId
      const deeper = walk(childId)
      if (deeper) return deeper
    }
    return undefined
  }
  return walk(parentId)
}

export function getVisibleNodes(store: NormalizedData, filters?: VisibilityFilter[]): string[] {
  const visible: string[] = []
  let _visitCount = 0
  const hasDescendFilter = filters?.some(f => f.shouldDescend) ?? false
  const hasFocusableFilter = filters?.some(f => f.isFocusable) ?? false

  const visitChild = (childId: string) => {
    _visitCount++
    if (_visitCount > 5000) { console.error('[getVisibleNodes] visit loop, count:', _visitCount); return }
    if (filters?.some(f => f.shouldShow && !f.shouldShow(childId, store))) return

    // isFocusable: false → skip from visible list but still walk children
    const focusable = !hasFocusableFilter || !filters?.some(f => f.isFocusable && !f.isFocusable(childId, store))

    const grandChildren = getChildren(store, childId)
    const grandSlots = getSlotChildren(store, childId)
    const isContainer = grandChildren.length > 0 || grandSlots.length > 0

    const canDescend = !filters?.some(f => f.shouldDescend && !f.shouldDescend(childId, store))

    if (!focusable) {
      if (canDescend) walk(childId)
    } else if (isContainer && !hasDescendFilter && !hasFocusableFilter) {
      walk(childId)
    } else {
      visible.push(childId)
      if (canDescend) walk(childId)
    }
  }

  const walk = (parentId: string) => {
    for (const childId of getChildren(store, parentId)) visitChild(childId)
    for (const childId of getSlotChildren(store, parentId)) visitChild(childId)
  }

  walk(ROOT_ID)
  return visible
}
`;export{e as default};
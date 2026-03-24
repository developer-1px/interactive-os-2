import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'
import type { CommandEngine } from './createCommandEngine'
import { EXPANDED_ID } from '../plugins/core'
import { SEARCH_ID, matchesSearchFilter } from '../plugins/search'

/**
 * Build flat list of visible node IDs by depth-first walk from __root__.
 *
 * Gating rule: if __expanded__ entity exists, only descend into expanded nodes.
 * If __expanded__ entity is absent (pattern doesn't use expand axis), walk all children.
 *
 * Search rule: if __search__.filterText is set, skip nodes that don't match.
 */
export function getVisibleNodes(engine: CommandEngine): string[] {
  const store = engine.getStore()
  const expandedEntity = store.entities[EXPANDED_ID]
  const expandedIds = expandedEntity ? (expandedEntity.expandedIds as string[]) ?? [] : null
  const searchEntity = store.entities[SEARCH_ID] as Record<string, unknown> | undefined
  const searchFilterText = (searchEntity?.filterText as string) ?? ''
  const visible: string[] = []

  const walk = (parentId: string) => {
    const children = getChildren(store, parentId)
    for (const childId of children) {
      if (searchFilterText && !matchesSearchFilter(store.entities[childId], searchFilterText)) {
        continue // skip this node entirely (don't push, don't walk children)
      }
      visible.push(childId)
      if (!expandedIds || expandedIds.includes(childId)) {
        walk(childId)
      }
    }
  }

  walk(ROOT_ID)
  return visible
}

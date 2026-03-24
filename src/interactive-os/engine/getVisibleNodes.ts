import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'
import type { CommandEngine } from './createCommandEngine'
import { EXPANDED_ID } from '../plugins/core'

/**
 * Build flat list of visible node IDs respecting expanded/collapsed state.
 * Walks depth-first from __root__, only descends into expanded nodes.
 */
export function getVisibleNodes(engine: CommandEngine): string[] {
  const store = engine.getStore()
  const expandedIds = (store.entities[EXPANDED_ID]?.expandedIds as string[]) ?? []
  const visible: string[] = []

  const walk = (parentId: string) => {
    const children = getChildren(store, parentId)
    for (const childId of children) {
      visible.push(childId)
      if (expandedIds.includes(childId)) {
        walk(childId)
      }
    }
  }

  walk(ROOT_ID)
  return visible
}

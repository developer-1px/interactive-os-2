import { ROOT_ID } from '../store/types'
import { getChildren } from '../store/createStore'
import type { CommandEngine } from './createCommandEngine'
import { EXPANDED_ID } from '../plugins/core'

/**
 * Build flat list of visible node IDs by depth-first walk from __root__.
 *
 * Gating rule: if __expanded__ entity exists, only descend into expanded nodes.
 * If __expanded__ entity is absent (pattern doesn't use expand axis), walk all children.
 */
export function getVisibleNodes(engine: CommandEngine): string[] {
  const store = engine.getStore()
  const expandedEntity = store.entities[EXPANDED_ID]
  const expandedIds = expandedEntity ? (expandedEntity.expandedIds as string[]) ?? [] : null
  const visible: string[] = []

  const walk = (parentId: string) => {
    const children = getChildren(store, parentId)
    for (const childId of children) {
      visible.push(childId)
      if (!expandedIds || expandedIds.includes(childId)) {
        walk(childId)
      }
    }
  }

  walk(ROOT_ID)
  return visible
}

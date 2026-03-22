import { getChildren } from '../../interactive-os/core/createStore'
import type { NormalizedData } from '../../interactive-os/core/types'

/** DFS collect all nodes with type === 'section'. Container-type agnostic. */
export function collectSections(store: NormalizedData, parentId: string): string[] {
  return getChildren(store, parentId).flatMap(id => {
    const d = (store.entities[id]?.data ?? {}) as Record<string, unknown>
    return d.type === 'section' ? [id] : collectSections(store, id)
  })
}

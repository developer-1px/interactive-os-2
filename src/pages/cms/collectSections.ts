import { getChildren, getParent } from '../../interactive-os/core/createStore'
import { ROOT_ID } from '../../interactive-os/core/types'
import type { NormalizedData } from '../../interactive-os/core/types'

/** DFS collect all nodes with type === 'section'. Container-type agnostic. */
export function collectSections(store: NormalizedData, parentId: string): string[] {
  return getChildren(store, parentId).flatMap(id => {
    const d = (store.entities[id]?.data ?? {}) as Record<string, unknown>
    return d.type === 'section' ? [id] : collectSections(store, id)
  })
}

/** Walk up to ROOT_ID, return the direct child of ROOT_ID in the ancestor chain. */
export function getRootAncestor(store: NormalizedData, nodeId: string): string {
  let current = nodeId
  while (true) {
    const parent = getParent(store, current)
    if (!parent || parent === ROOT_ID) return current
    current = parent
  }
}

/** Walk up from nodeId, return first ancestor with type === 'tab-item', or undefined. */
export function getTabItemAncestor(store: NormalizedData, nodeId: string): string | undefined {
  let current = getParent(store, nodeId)
  while (current && current !== ROOT_ID) {
    const d = (store.entities[current]?.data ?? {}) as Record<string, unknown>
    if (d.type === 'tab-item') return current
    current = getParent(store, current)
  }
  return undefined
}

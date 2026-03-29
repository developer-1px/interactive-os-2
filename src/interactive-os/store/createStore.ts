import type { Entity, NormalizedData } from './types'
import { ROOT_ID } from './types'

export function createStore(initial?: Partial<NormalizedData>): NormalizedData {
  return {
    entities: initial?.entities ?? {},
    relationships: { [ROOT_ID]: [], ...initial?.relationships },
  }
}

export function getEntity(store: NormalizedData, id: string): Entity | undefined {
  return store.entities[id]
}

export function getChildren(store: NormalizedData, parentId: string): string[] {
  return store.relationships[parentId] ?? []
}

/** O(n) where n = total children across all relationship entries. No reverse index — sufficient for current store sizes. */
export function getParent(store: NormalizedData, nodeId: string): string | undefined {
  for (const [parentId, children] of Object.entries(store.relationships)) {
    if (children.includes(nodeId)) return parentId
  }
  return undefined
}

export function addEntity(
  store: NormalizedData, entity: Entity, parentId: string = ROOT_ID, index?: number
): NormalizedData {
  // Filter out existing ID to prevent duplicates in relationship array
  const currentChildren = getChildren(store, parentId).filter((id) => id !== entity.id)
  const newChildren = index !== undefined
    ? [...currentChildren.slice(0, index), entity.id, ...currentChildren.slice(index)]
    : [...currentChildren, entity.id]
  return {
    entities: { ...store.entities, [entity.id]: entity },
    relationships: { ...store.relationships, [parentId]: newChildren },
  }
}

export function removeEntity(store: NormalizedData, nodeId: string): NormalizedData {
  const toRemove = new Set<string>()
  const collect = (id: string) => {
    toRemove.add(id)
    for (const childId of getChildren(store, id)) collect(childId)
  }
  collect(nodeId)

  const entities: Record<string, Entity> = {}
  for (const [id, entity] of Object.entries(store.entities)) {
    if (!toRemove.has(id)) entities[id] = entity
  }

  const relationships: Record<string, string[]> = {}
  for (const [parentId, children] of Object.entries(store.relationships)) {
    if (!toRemove.has(parentId)) {
      relationships[parentId] = children.filter((id) => !toRemove.has(id))
    }
  }

  return { entities, relationships }
}

export function updateEntity(
  store: NormalizedData, nodeId: string, updates: Partial<Entity>
): NormalizedData {
  const existing = store.entities[nodeId]
  if (!existing) return store
  return {
    ...store,
    entities: { ...store.entities, [nodeId]: { ...existing, ...updates, id: nodeId } },
  }
}

/** @param index — insertion index in the target's children list (after removing nodeId if same parent). */
export function moveNode(
  store: NormalizedData, nodeId: string, newParentId: string, index?: number
): NormalizedData {
  const oldParentId = getParent(store, nodeId)
  if (!oldParentId) return store

  const isSameParent = oldParentId === newParentId
  const oldChildren = getChildren(store, oldParentId).filter((id) => id !== nodeId)
  const targetChildren = isSameParent
    ? oldChildren
    : getChildren(store, newParentId)
  const insertAt = index !== undefined ? index : targetChildren.length
  const updatedTarget = [...targetChildren.slice(0, insertAt), nodeId, ...targetChildren.slice(insertAt)]

  const relationships = {
    ...store.relationships,
    [oldParentId]: isSameParent ? updatedTarget : oldChildren,
    ...(isSameParent ? {} : { [newParentId]: updatedTarget }),
  }

  return { ...store, relationships }
}

export function getEntityData<T extends Record<string, unknown>>(
  store: NormalizedData, id: string
): T | undefined {
  return store.entities[id]?.data as T | undefined
}

export function updateEntityData(
  store: NormalizedData, nodeId: string, updates: Record<string, unknown>
): NormalizedData {
  const existing = store.entities[nodeId]
  if (!existing) return store
  return {
    ...store,
    entities: {
      ...store.entities,
      [nodeId]: { ...existing, data: { ...existing.data, ...updates } },
    },
  }
}

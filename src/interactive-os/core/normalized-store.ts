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

// TODO: O(n*m) — for large stores, consider adding a reverse index (childId → parentId)
export function getParent(store: NormalizedData, nodeId: string): string | undefined {
  for (const [parentId, children] of Object.entries(store.relationships)) {
    if (children.includes(nodeId)) return parentId
  }
  return undefined
}

export function addEntity(
  store: NormalizedData, entity: Entity, parentId: string = ROOT_ID, index?: number
): NormalizedData {
  const currentChildren = getChildren(store, parentId)
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

export function moveNode(
  store: NormalizedData, nodeId: string, newParentId: string, index?: number
): NormalizedData {
  const oldParentId = getParent(store, nodeId)
  if (!oldParentId) return store

  const oldChildren = getChildren(store, oldParentId).filter((id) => id !== nodeId)
  const newChildren = getChildren(store, newParentId)
  const insertAt = index !== undefined ? index : newChildren.length

  const updatedNewChildren = oldParentId === newParentId
    ? (() => {
        const without = oldChildren
        return [...without.slice(0, insertAt), nodeId, ...without.slice(insertAt)]
      })()
    : [...newChildren.slice(0, insertAt), nodeId, ...newChildren.slice(insertAt)]

  const relationships = {
    ...store.relationships,
    [oldParentId]: oldParentId === newParentId ? updatedNewChildren : oldChildren,
    ...(oldParentId !== newParentId ? { [newParentId]: updatedNewChildren } : {}),
  }

  return { ...store, relationships }
}

export function insertNode(
  store: NormalizedData, entity: Entity, parentId: string, index: number
): NormalizedData {
  return addEntity(store, entity, parentId, index)
}

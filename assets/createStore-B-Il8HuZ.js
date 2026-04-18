var e=`import type { Entity, NormalizedData } from './types'
import { ROOT_ID } from './types'

export function createStore(initial?: Partial<NormalizedData>): NormalizedData {
  return {
    entities: initial?.entities ?? {},
    relationships: { [ROOT_ID]: [], ...initial?.relationships },
    slots: initial?.slots ?? {},
  }
}

export function getEntity(store: NormalizedData, id: string): Entity | undefined {
  return store.entities[id]
}

export function getChildren(store: NormalizedData, parentId: string): string[] {
  return store.relationships[parentId] ?? []
}

/** Get named slot children as ordered array (Zod field declaration order). */
export function getSlotChildren(store: NormalizedData, parentId: string): string[] {
  const slotMap = store.slots?.[parentId]
  return slotMap ? Object.values(slotMap) : []
}

/** Get the slot map for a parent: { slotName → childId }. */
export function getSlots(store: NormalizedData, parentId: string): Record<string, string> | undefined {
  return store.slots?.[parentId]
}

/** O(n) where n = total children across all relationship + slot entries. No reverse index — sufficient for current store sizes. */
export function getParent(store: NormalizedData, nodeId: string): string | undefined {
  for (const [parentId, children] of Object.entries(store.relationships)) {
    if (children.includes(nodeId)) return parentId
  }
  if (store.slots) {
    for (const [parentId, slotMap] of Object.entries(store.slots)) {
      if (Object.values(slotMap).includes(nodeId)) return parentId
    }
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
    ...(store.slots ? { slots: store.slots } : {}),
  }
}

export function removeEntity(store: NormalizedData, nodeId: string): NormalizedData {
  const toRemove = new Set<string>()
  const collect = (id: string) => {
    toRemove.add(id)
    for (const childId of getChildren(store, id)) collect(childId)
    for (const childId of getSlotChildren(store, id)) collect(childId)
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

  const slots: Record<string, Record<string, string>> = {}
  if (store.slots) {
    for (const [parentId, slotMap] of Object.entries(store.slots)) {
      if (!toRemove.has(parentId)) {
        const filtered: Record<string, string> = {}
        for (const [name, childId] of Object.entries(slotMap)) {
          if (!toRemove.has(childId)) filtered[name] = childId
        }
        if (Object.keys(filtered).length > 0) slots[parentId] = filtered
      }
    }
  }

  return { entities, relationships, slots }
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

// ② engine-validator-clipboard-prd.md
/** Extract subtrees rooted at \`nodeIds\` into a standalone NormalizedData. */
export function extractSubtree(store: NormalizedData, nodeIds: string[]): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = {}
  const rootChildren: string[] = []

  const collect = (id: string) => {
    const entity = store.entities[id]
    if (!entity) return
    entities[id] = { ...entity }
    const children = getChildren(store, id)
    if (children.length > 0) {
      relationships[id] = [...children]
      for (const childId of children) {
        collect(childId)
      }
    }
  }

  for (const id of nodeIds) {
    collect(id)
    rootChildren.push(id)
  }

  return { entities, relationships: { [ROOT_ID]: rootChildren, ...relationships }, slots: {} }
}

let _mergeIdCounter = 0

/** Reset merge ID counter — for tests */
export function resetMergeIdCounter(): void {
  _mergeIdCounter = 0
}

function generateMergeId(originalId: string): string {
  return \`\${originalId}-copy-\${++_mergeIdCounter}\`
}

// ② engine-validator-clipboard-prd.md
/** Merge a NormalizedData subtree into store under \`parentId\` at optional \`index\`. */
export function mergeSubtree(
  store: NormalizedData,
  subtree: NormalizedData,
  parentId: string,
  index?: number,
  generateNewIds?: boolean,
): NormalizedData {
  const rootChildren = subtree.relationships[ROOT_ID] ?? []
  if (rootChildren.length === 0) return store

  let result = store
  for (let i = 0; i < rootChildren.length; i++) {
    const idx = index !== undefined ? index + i : undefined
    result = insertSubtreeNode(result, subtree, rootChildren[i]!, parentId, generateNewIds ?? false, idx)
  }
  return result
}

function insertSubtreeNode(
  store: NormalizedData,
  subtree: NormalizedData,
  nodeId: string,
  parentId: string,
  generateNewIds: boolean,
  index?: number,
): NormalizedData {
  const entity = subtree.entities[nodeId]
  if (!entity) return store

  const newId = generateNewIds ? generateMergeId(entity.id) : entity.id
  const newEntity = { ...entity, id: newId }

  let result = addEntity(store, newEntity, parentId, index)

  const children = subtree.relationships[nodeId] ?? []
  for (const childId of children) {
    result = insertSubtreeNode(result, subtree, childId, newId, generateNewIds)
  }

  return result
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
`;export{e as default};
var e=`// ② list-xray-prd.md
import type { NormalizedData, Entity } from '@os/store/types'

export function filterStore(
  store: NormalizedData,
  extensions: string[],
): NormalizedData {
  if (extensions.length === 0) return store

  const kept = new Set<string>()

  function matches(entity: Entity): boolean {
    const name = (entity.data as Record<string, unknown> | undefined)?.name as string | undefined
    if (!name) return false
    return extensions.some(ext => name.endsWith(ext))
  }

  function walk(id: string): boolean {
    const entity = store.entities[id]
    if (!entity) return false

    const type = (entity.data as Record<string, unknown> | undefined)?.type
    if (type === 'directory') {
      const children = store.relationships[id] ?? []
      let hasMatch = false
      for (const childId of children) {
        if (walk(childId)) hasMatch = true
      }
      if (hasMatch) { kept.add(id); return true }
      return false
    }

    if (matches(entity)) { kept.add(id); return true }
    return false
  }

  for (const rootId of store.relationships['__root__'] ?? []) {
    walk(rootId)
  }

  // Also keep meta entities
  const entities: Record<string, Entity> = {}
  for (const [id, entity] of Object.entries(store.entities)) {
    if (id.startsWith('__') || kept.has(id)) {
      entities[id] = entity
    }
  }

  const relationships: Record<string, string[]> = {}
  for (const [parentId, children] of Object.entries(store.relationships)) {
    relationships[parentId] = children.filter(id => kept.has(id))
  }

  return { ...store, entities, relationships }
}
`;export{e as default};
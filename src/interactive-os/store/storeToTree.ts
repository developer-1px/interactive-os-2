import type { NormalizedData, Entity } from './types'
import { ROOT_ID } from './types'

export function storeToTree(source: NormalizedData): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = {}

  const ENTITIES_GROUP = '_group:entities'
  const RELS_GROUP = '_group:relationships'

  entities[ENTITIES_GROUP] = {
    id: ENTITIES_GROUP,
    data: { label: 'entities', type: 'group', count: Object.keys(source.entities).length },
  }
  entities[RELS_GROUP] = {
    id: RELS_GROUP,
    data: { label: 'relationships', type: 'group', count: Object.keys(source.relationships).length },
  }
  relationships[ROOT_ID] = [ENTITIES_GROUP, RELS_GROUP]

  const entityChildren: string[] = []
  for (const [id, entity] of Object.entries(source.entities)) {
    const nodeId = `_e:${id}`
    const isMeta = id.startsWith('__')
     
    const { id: _id, ...rest } = entity
    entities[nodeId] = {
      id: nodeId,
      data: { label: id, type: isMeta ? 'meta' : 'entity', value: JSON.stringify(rest) },
    }
    entityChildren.push(nodeId)
  }
  relationships[ENTITIES_GROUP] = entityChildren

  const relChildren: string[] = []
  for (const [parentId, childIds] of Object.entries(source.relationships)) {
    const nodeId = `_r:${parentId}`
    entities[nodeId] = {
      id: nodeId,
      data: { label: `${parentId} → [${childIds.join(', ')}]`, type: 'rel' },
    }
    relChildren.push(nodeId)
  }
  relationships[RELS_GROUP] = relChildren

  return { entities, relationships }
}

// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { storeToTree } from '../store/storeToTree'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'

describe('storeToTree', () => {
  const source: NormalizedData = {
    entities: {
      __focus__: { id: '__focus__', focusedId: 'item-1' },
      'item-1': { id: 'item-1', data: { name: 'Hello' } },
      'item-2': { id: 'item-2', data: { name: 'World' } },
    },
    relationships: {
      [ROOT_ID]: ['item-1', 'item-2'],
    },
  }

  it('produces two root groups: entities and relationships', () => {
    const tree = storeToTree(source)
    const rootChildren = tree.relationships[ROOT_ID]
    expect(rootChildren).toEqual(['_group:entities', '_group:relationships'])
  })

  it('entities group contains all source entities with _e: prefix', () => {
    const tree = storeToTree(source)
    const entityChildren = tree.relationships['_group:entities']
    expect(entityChildren).toContain('_e:__focus__')
    expect(entityChildren).toContain('_e:item-1')
    expect(entityChildren).toContain('_e:item-2')
    expect(entityChildren).toHaveLength(3)
  })

  it('classifies meta entities (__ prefix) as type meta', () => {
    const tree = storeToTree(source)
    const focusData = tree.entities['_e:__focus__']?.data as Record<string, unknown>
    expect(focusData.type).toBe('meta')
    const itemData = tree.entities['_e:item-1']?.data as Record<string, unknown>
    expect(itemData.type).toBe('entity')
  })

  it('entity value contains stringified entity content', () => {
    const tree = storeToTree(source)
    const focusEntity = tree.entities['_e:__focus__']
    expect((focusEntity?.data as Record<string, unknown>).value).toContain('focusedId')
  })

  it('relationships group lists each parent→children mapping', () => {
    const tree = storeToTree(source)
    const relChildren = tree.relationships['_group:relationships']
    expect(relChildren).toContain('_r:__root__')
    const rootRel = tree.entities['_r:__root__']
    expect((rootRel?.data as Record<string, unknown>).label).toBe('__root__ → [item-1, item-2]')
  })

  it('handles empty store', () => {
    const empty: NormalizedData = { entities: {}, relationships: { [ROOT_ID]: [] } }
    const tree = storeToTree(empty)
    expect(tree.relationships['_group:entities']).toEqual([])
    expect(tree.relationships['_group:relationships']).toContain('_r:__root__')
  })

  it('group nodes have count in data', () => {
    const tree = storeToTree(source)
    const entitiesGroup = tree.entities['_group:entities']
    expect((entitiesGroup?.data as Record<string, unknown>).count).toBe(3)
  })
})

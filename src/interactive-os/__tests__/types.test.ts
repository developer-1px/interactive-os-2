import { describe, it, expect } from 'vitest'
import type {
  Entity,
  NormalizedData,
  Command,
  TransformAdapter,
} from '../core/types'
import { createBatchCommand } from '../core/types'

describe('Core Types', () => {
  it('NormalizedData has entities and relationships', () => {
    const data: NormalizedData = {
      entities: {
        'node-1': { id: 'node-1', name: 'src' },
        'node-2': { id: 'node-2', name: 'App.tsx' },
      },
      relationships: {
        __root__: ['node-1'],
        'node-1': ['node-2'],
      },
    }

    expect(data.entities['node-1']?.id).toBe('node-1')
    expect(data.relationships['__root__']).toEqual(['node-1'])
    expect(data.relationships['node-1']).toEqual(['node-2'])
  })

  it('Entity supports arbitrary fields', () => {
    const entity: Entity = {
      id: 'file-1',
      name: 'README.md',
      size: 1024,
      tags: ['docs'],
    }

    expect(entity.id).toBe('file-1')
    expect(entity['name']).toBe('README.md')
  })

  it('Command has execute and undo that return new store', () => {
    const addEntity: Command = {
      type: 'crud:add',
      payload: { id: 'new-1', name: 'New' },
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            'new-1': { id: 'new-1', name: 'New' },
          },
        }
      },
      undo(store) {
        const { 'new-1': _, ...rest } = store.entities
        return { ...store, entities: rest }
      },
    }

    const initial: NormalizedData = { entities: {}, relationships: {} }
    const after = addEntity.execute(initial)
    expect(after.entities['new-1']).toEqual({ id: 'new-1', name: 'New' })

    const reverted = addEntity.undo(after)
    expect(reverted.entities['new-1']).toBeUndefined()
  })

  it('createBatchCommand executes commands in order, undoes in reverse', () => {
    const cmd1: Command = {
      type: 'test:add-a',
      payload: null,
      execute: (s) => ({
        ...s,
        entities: { ...s.entities, a: { id: 'a' } },
      }),
      undo: (s) => {
        const { a: _, ...rest } = s.entities
        return { ...s, entities: rest }
      },
    }

    const cmd2: Command = {
      type: 'test:add-b',
      payload: null,
      execute: (s) => ({
        ...s,
        entities: { ...s.entities, b: { id: 'b' } },
      }),
      undo: (s) => {
        const { b: _, ...rest } = s.entities
        return { ...s, entities: rest }
      },
    }

    const batch = createBatchCommand([cmd1, cmd2])

    const initial: NormalizedData = { entities: {}, relationships: {} }
    const after = batch.execute(initial)
    expect(Object.keys(after.entities)).toEqual(['a', 'b'])

    const reverted = batch.undo(after)
    expect(Object.keys(reverted.entities)).toEqual([])
  })

  it('createBatchCommand methods work when destructured', () => {
    const cmd: Command = {
      type: 'test:add-x',
      payload: null,
      execute: (s) => ({ ...s, entities: { ...s.entities, x: { id: 'x' } } }),
      undo: (s) => {
        const { x: _, ...rest } = s.entities
        return { ...s, entities: rest }
      },
    }

    const batch = createBatchCommand([cmd])
    const { execute, undo } = batch
    const initial: NormalizedData = { entities: {}, relationships: {} }

    const after = execute(initial)
    expect(after.entities['x']).toBeDefined()

    const reverted = undo(after)
    expect(reverted.entities['x']).toBeUndefined()
  })

  it('TransformAdapter normalizes and denormalizes', () => {
    interface FileNode { name: string; children?: FileNode[] }

    const adapter: TransformAdapter<FileNode[]> = {
      normalize(files) {
        const entities: Record<string, Entity> = {}
        const relationships: Record<string, string[]> = { __root__: [] }
        let counter = 0

        const walk = (nodes: FileNode[], parentId: string) => {
          for (const node of nodes) {
            const id = `node-${counter++}`
            entities[id] = { id, name: node.name }
            if (!relationships[parentId]) relationships[parentId] = []
            relationships[parentId]!.push(id)
            if (node.children) walk(node.children, id)
          }
        }
        walk(files, '__root__')
        return { entities, relationships }
      },
      denormalize(data) {
        const build = (parentId: string): FileNode[] => {
          return (data.relationships[parentId] ?? []).map((id) => {
            const entity = data.entities[id]!
            const children = build(id)
            return children.length
              ? { name: entity.name as string, children }
              : { name: entity.name as string }
          })
        }
        return build('__root__')
      },
    }

    const input: FileNode[] = [{ name: 'src', children: [{ name: 'App.tsx' }] }]
    const normalized = adapter.normalize(input)

    expect(Object.keys(normalized.entities)).toHaveLength(2)
    expect(normalized.relationships['__root__']).toHaveLength(1)

    const denormalized = adapter.denormalize(normalized)
    expect(denormalized).toEqual(input)
  })
})

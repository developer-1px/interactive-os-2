import { describe, it, expect } from 'vitest'
import {
  createStore,
  getEntity,
  getChildren,
  getParent,
  addEntity,
  removeEntity,
  updateEntity,
  moveNode,
  insertNode,
} from '../core/createStore'
import { ROOT_ID } from '../core/types'
import type { NormalizedData } from '../core/types'

function fixtureStore(): NormalizedData {
  return createStore({
    entities: {
      folder1: { id: 'folder1', data: { name: 'src' } },
      file1: { id: 'file1', data: { name: 'App.tsx' } },
      file2: { id: 'file2', data: { name: 'main.tsx' } },
    },
    relationships: {
      [ROOT_ID]: ['folder1'],
      folder1: ['file1', 'file2'],
    },
  })
}

describe('createStore', () => {
  it('creates an empty store with __root__', () => {
    const store = createStore()
    expect(store.entities).toEqual({})
    expect(store.relationships).toEqual({ [ROOT_ID]: [] })
  })

  it('creates a store from initial data', () => {
    const store = fixtureStore()
    expect(Object.keys(store.entities)).toHaveLength(3)
    expect(store.relationships[ROOT_ID]).toEqual(['folder1'])
  })
})

describe('getEntity', () => {
  it('returns entity by id', () => {
    const store = fixtureStore()
    expect(getEntity(store, 'folder1')).toEqual({ id: 'folder1', data: { name: 'src' } })
  })

  it('returns undefined for missing id', () => {
    const store = fixtureStore()
    expect(getEntity(store, 'nope')).toBeUndefined()
  })
})

describe('getChildren', () => {
  it('returns child ids', () => {
    const store = fixtureStore()
    expect(getChildren(store, 'folder1')).toEqual(['file1', 'file2'])
  })

  it('returns empty array for leaf node', () => {
    const store = fixtureStore()
    expect(getChildren(store, 'file1')).toEqual([])
  })
})

describe('getParent', () => {
  it('returns parent id', () => {
    const store = fixtureStore()
    expect(getParent(store, 'file1')).toBe('folder1')
  })

  it('returns __root__ for top-level node', () => {
    const store = fixtureStore()
    expect(getParent(store, 'folder1')).toBe(ROOT_ID)
  })

  it('returns undefined for unknown node', () => {
    const store = fixtureStore()
    expect(getParent(store, 'nope')).toBeUndefined()
  })
})

describe('addEntity', () => {
  it('adds entity and relationship', () => {
    const store = fixtureStore()
    const next = addEntity(store, { id: 'file3', data: { name: 'index.ts' } }, 'folder1')
    expect(getEntity(next, 'file3')).toEqual({ id: 'file3', data: { name: 'index.ts' } })
    expect(getChildren(next, 'folder1')).toEqual(['file1', 'file2', 'file3'])
  })

  it('adds to root when no parent specified', () => {
    const store = fixtureStore()
    const next = addEntity(store, { id: 'folder2', data: { name: 'lib' } })
    expect(getChildren(next, ROOT_ID)).toEqual(['folder1', 'folder2'])
  })

  it('adds at specific index', () => {
    const store = fixtureStore()
    const next = addEntity(store, { id: 'file3', data: { name: 'index.ts' } }, 'folder1', 0)
    expect(getChildren(next, 'folder1')).toEqual(['file3', 'file1', 'file2'])
  })

  it('does not mutate original store', () => {
    const store = fixtureStore()
    addEntity(store, { id: 'file3', data: { name: 'index.ts' } }, 'folder1')
    expect(getChildren(store, 'folder1')).toEqual(['file1', 'file2'])
  })
})

describe('removeEntity', () => {
  it('removes entity and relationship', () => {
    const store = fixtureStore()
    const next = removeEntity(store, 'file1')
    expect(getEntity(next, 'file1')).toBeUndefined()
    expect(getChildren(next, 'folder1')).toEqual(['file2'])
  })

  it('removes entity with children recursively', () => {
    const store = fixtureStore()
    const next = removeEntity(store, 'folder1')
    expect(getEntity(next, 'folder1')).toBeUndefined()
    expect(getEntity(next, 'file1')).toBeUndefined()
    expect(getEntity(next, 'file2')).toBeUndefined()
    expect(getChildren(next, ROOT_ID)).toEqual([])
  })
})

describe('updateEntity', () => {
  it('updates entity fields immutably', () => {
    const store = fixtureStore()
    const next = updateEntity(store, 'file1', { data: { name: 'App.test.tsx' } })
    expect(getEntity(next, 'file1')).toEqual({ id: 'file1', data: { name: 'App.test.tsx' } })
    expect((getEntity(store, 'file1')?.data as Record<string, unknown>)?.name).toBe('App.tsx')
  })
})

describe('moveNode', () => {
  it('moves node to new parent', () => {
    let store = fixtureStore()
    store = addEntity(store, { id: 'folder2', data: { name: 'lib' } })
    const next = moveNode(store, 'file1', 'folder2')
    expect(getChildren(next, 'folder1')).toEqual(['file2'])
    expect(getChildren(next, 'folder2')).toEqual(['file1'])
  })

  it('moves node to specific index', () => {
    const store = fixtureStore()
    const next = moveNode(store, 'file2', 'folder1', 0)
    expect(getChildren(next, 'folder1')).toEqual(['file2', 'file1'])
  })
})

describe('insertNode', () => {
  it('inserts at specific position in relationship', () => {
    const store = fixtureStore()
    const next = insertNode(store, { id: 'file3', data: { name: 'new.ts' } }, 'folder1', 1)
    expect(getChildren(next, 'folder1')).toEqual(['file1', 'file3', 'file2'])
  })
})

describe('edge cases', () => {
  it('removeEntity on non-existent id returns store unchanged', () => {
    const store = fixtureStore()
    const next = removeEntity(store, 'nonexistent')
    expect(next.entities).toEqual(store.entities)
  })

  it('updateEntity on non-existent id returns store unchanged', () => {
    const store = fixtureStore()
    const next = updateEntity(store, 'nonexistent', { data: { name: 'nope' } })
    expect(next).toBe(store)
  })

  it('addEntity with duplicate id overwrites entity', () => {
    const store = fixtureStore()
    const next = addEntity(store, { id: 'file1', data: { name: 'Overwritten.tsx' } }, 'folder1')
    expect((getEntity(next, 'file1')?.data as Record<string, unknown>)?.name).toBe('Overwritten.tsx')
  })

  it('getParent returns undefined for unknown node in empty store', () => {
    const store = createStore()
    expect(getParent(store, 'nonexistent')).toBeUndefined()
  })
})

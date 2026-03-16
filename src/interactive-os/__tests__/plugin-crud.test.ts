import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from '../core/command-engine'
import { createStore, getEntity, getChildren } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import { crudCommands, crud } from '../plugins/crud'

function fixtureStore() {
  return createStore({
    entities: {
      folder1: { id: 'folder1', name: 'src' },
      file1: { id: 'file1', name: 'App.tsx' },
      file2: { id: 'file2', name: 'main.tsx' },
    },
    relationships: {
      [ROOT_ID]: ['folder1'],
      folder1: ['file1', 'file2'],
    },
  })
}

describe('crud() plugin factory', () => {
  it('returns commands map', () => {
    const plugin = crud()
    expect(plugin.commands).toBeDefined()
    expect(plugin.commands!['create']).toBe(crudCommands.create)
    expect(plugin.commands!['delete']).toBe(crudCommands.remove)
  })
})

describe('crudCommands.create', () => {
  it('creates a new entity under a parent', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(crudCommands.create({ id: 'file3', name: 'index.ts' }, 'folder1'))

    expect(getEntity(engine.getStore(), 'file3')).toEqual({ id: 'file3', name: 'index.ts' })
    expect(getChildren(engine.getStore(), 'folder1')).toEqual(['file1', 'file2', 'file3'])
  })

  it('creates at root when no parent specified', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(crudCommands.create({ id: 'folder2', name: 'lib' }))

    expect(getChildren(engine.getStore(), ROOT_ID)).toEqual(['folder1', 'folder2'])
  })

  it('creates at specific index', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(crudCommands.create({ id: 'file3', name: 'index.ts' }, 'folder1', 0))

    expect(getChildren(engine.getStore(), 'folder1')).toEqual(['file3', 'file1', 'file2'])
  })

  it('undo removes the created entity', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    const cmd = crudCommands.create({ id: 'file3', name: 'index.ts' }, 'folder1')
    engine.dispatch(cmd)

    const undone = cmd.undo(engine.getStore())
    expect(getEntity(undone, 'file3')).toBeUndefined()
    expect(getChildren(undone, 'folder1')).toEqual(['file1', 'file2'])
  })
})

describe('crudCommands.remove', () => {
  it('removes an entity', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(crudCommands.remove('file1'))

    expect(getEntity(engine.getStore(), 'file1')).toBeUndefined()
    expect(getChildren(engine.getStore(), 'folder1')).toEqual(['file2'])
  })

  it('removes entity with children recursively', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(crudCommands.remove('folder1'))

    expect(getEntity(engine.getStore(), 'folder1')).toBeUndefined()
    expect(getEntity(engine.getStore(), 'file1')).toBeUndefined()
    expect(getEntity(engine.getStore(), 'file2')).toBeUndefined()
  })

  it('undo restores the removed entity and its children', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    const cmd = crudCommands.remove('folder1')
    engine.dispatch(cmd)

    const undone = cmd.undo(engine.getStore())
    expect(getEntity(undone, 'folder1')).toEqual({ id: 'folder1', name: 'src' })
    expect(getEntity(undone, 'file1')).toEqual({ id: 'file1', name: 'App.tsx' })
    expect(getChildren(undone, 'folder1')).toEqual(['file1', 'file2'])
    expect(getChildren(undone, ROOT_ID)).toEqual(['folder1'])
  })

  it('removes multiple selected nodes', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(crudCommands.removeMultiple(['file1', 'file2']))

    expect(getEntity(engine.getStore(), 'file1')).toBeUndefined()
    expect(getEntity(engine.getStore(), 'file2')).toBeUndefined()
    expect(getChildren(engine.getStore(), 'folder1')).toEqual([])
  })
})

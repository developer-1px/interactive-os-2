import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from '../core/createCommandEngine'
import { createStore, getEntity } from '../core/createStore'
import { ROOT_ID } from '../core/types'
import { renameCommands, rename } from '../plugins/rename'

function fixtureStore() {
  return createStore({
    entities: {
      file1: { id: 'file1', data: { name: 'App.tsx', size: 1024 } },
    },
    relationships: {
      [ROOT_ID]: ['file1'],
    },
  })
}

describe('rename() plugin factory', () => {
  it('returns commands map', () => {
    const plugin = rename()
    expect(plugin.commands!['startRename']).toBe(renameCommands.startRename)
    expect(plugin.commands!['confirmRename']).toBe(renameCommands.confirmRename)
    expect(plugin.commands!['cancelRename']).toBe(renameCommands.cancelRename)
  })
})

describe('renameCommands.startRename', () => {
  it('sets rename state for a node', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(renameCommands.startRename('file1'))

    const renameState = engine.getStore().entities['__rename__']
    expect(renameState?.nodeId).toBe('file1')
    expect(renameState?.active).toBe(true)
  })

  it('undo clears rename state', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    const cmd = renameCommands.startRename('file1')
    engine.dispatch(cmd)

    const undone = cmd.undo(engine.getStore())
    expect(undone.entities['__rename__']).toBeUndefined()
  })
})

describe('renameCommands.confirmRename', () => {
  it('updates entity field and clears rename state', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(renameCommands.startRename('file1'))
    engine.dispatch(renameCommands.confirmRename('file1', 'name', 'App.test.tsx'))

    expect((getEntity(engine.getStore(), 'file1')?.data as Record<string, unknown>)?.name).toBe('App.test.tsx')
    expect(engine.getStore().entities['__rename__']?.active).toBe(false)
  })

  it('preserves other entity fields', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(renameCommands.startRename('file1'))
    engine.dispatch(renameCommands.confirmRename('file1', 'name', 'NewName.tsx'))

    const entity = getEntity(engine.getStore(), 'file1')
    expect((entity?.data as Record<string, unknown>)?.name).toBe('NewName.tsx')
    expect((entity?.data as Record<string, unknown>)?.size).toBe(1024) // preserved
  })

  it('undo restores original value', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(renameCommands.startRename('file1'))
    const cmd = renameCommands.confirmRename('file1', 'name', 'NewName.tsx')
    engine.dispatch(cmd)

    const undone = cmd.undo(engine.getStore())
    expect((getEntity(undone, 'file1')?.data as Record<string, unknown>)?.name).toBe('App.tsx')
  })
})

describe('renameCommands.cancelRename', () => {
  it('clears rename state without changing entity', () => {
    const engine = createCommandEngine(fixtureStore(), [], vi.fn())
    engine.dispatch(renameCommands.startRename('file1'))
    engine.dispatch(renameCommands.cancelRename())

    expect(engine.getStore().entities['__rename__']?.active).toBe(false)
    expect((getEntity(engine.getStore(), 'file1')?.data as Record<string, unknown>)?.name).toBe('App.tsx') // unchanged
  })
})

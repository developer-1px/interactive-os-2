import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from '../core/command-engine'
import { createStore, getEntity, getChildren } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import { history, undoCommand, redoCommand } from '../plugins/history'
import { focusCommands, selectionCommands, expandCommands } from '../plugins/core'
import type { Middleware } from '../core/types'

describe('Integration: Store + Engine + Plugins', () => {
  function setup() {
    const onChange = vi.fn()
    const historyPlugin = history()
    const store = createStore({
      entities: {
        src: { id: 'src', name: 'src', type: 'folder' },
        app: { id: 'app', name: 'App.tsx', type: 'file' },
        main: { id: 'main', name: 'main.tsx', type: 'file' },
        lib: { id: 'lib', name: 'lib', type: 'folder' },
        utils: { id: 'utils', name: 'utils.ts', type: 'file' },
      },
      relationships: {
        [ROOT_ID]: ['src', 'lib'],
        src: ['app', 'main'],
        lib: ['utils'],
      },
    })
    const engine = createCommandEngine(store, [historyPlugin.middleware!], onChange)
    return { engine, onChange }
  }

  it('focus + expand + select workflow', () => {
    const { engine } = setup()
    engine.dispatch(focusCommands.setFocus('src'))
    engine.dispatch(expandCommands.expand('src'))
    engine.dispatch(selectionCommands.select('app'))
    const store = engine.getStore()
    expect(store.entities['__focus__']?.focusedId).toBe('src')
    expect((store.entities['__expanded__']?.expandedIds as string[])?.includes('src')).toBe(true)
    expect(store.entities['__selection__']?.selectedIds).toEqual(['app'])
  })

  it('undo/redo works with core commands', () => {
    const { engine } = setup()
    engine.dispatch(expandCommands.expand('src'))
    expect((engine.getStore().entities['__expanded__']?.expandedIds as string[])?.includes('src')).toBe(true)
    engine.dispatch(undoCommand())
    expect((engine.getStore().entities['__expanded__']?.expandedIds as string[] | undefined)?.includes('src')).toBeFalsy()
    engine.dispatch(redoCommand())
    expect((engine.getStore().entities['__expanded__']?.expandedIds as string[])?.includes('src')).toBe(true)
  })

  it('permissions middleware blocks commands', () => {
    const onChange = vi.fn()
    const historyPlugin = history()
    const noDeleteRoot: Middleware = (next) => (command) => {
      if (command.type === 'core:collapse' && (command.payload as { nodeId: string })?.nodeId === 'src') return
      next(command)
    }
    const store = createStore({
      entities: { src: { id: 'src', name: 'src' } },
      relationships: { [ROOT_ID]: ['src'] },
    })
    const engine = createCommandEngine(store, [noDeleteRoot, historyPlugin.middleware!], onChange)
    engine.dispatch(expandCommands.expand('src'))
    engine.dispatch(expandCommands.collapse('src'))
    expect((engine.getStore().entities['__expanded__']?.expandedIds as string[])?.includes('src')).toBe(true)
  })

  it('original entity data is preserved through operations', () => {
    const { engine } = setup()
    engine.dispatch(focusCommands.setFocus('src'))
    engine.dispatch(expandCommands.expand('src'))
    const store = engine.getStore()
    expect(getEntity(store, 'src')).toEqual({ id: 'src', name: 'src', type: 'folder' })
    expect(getEntity(store, 'app')).toEqual({ id: 'app', name: 'App.tsx', type: 'file' })
    expect(getChildren(store, 'src')).toEqual(['app', 'main'])
  })
})

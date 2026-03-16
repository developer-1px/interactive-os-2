import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createCommandEngine } from '../core/command-engine'
import { createStore, getEntity, getChildren } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import { history, undoCommand } from '../plugins/history'
import { focusCommands } from '../plugins/core'
import { crudCommands } from '../plugins/crud'
import { clipboardCommands, resetClipboard } from '../plugins/clipboard'
import { renameCommands } from '../plugins/rename'

beforeEach(() => {
  resetClipboard()
})

function fixtureStore() {
  return createStore({
    entities: {
      src: { id: 'src', name: 'src', type: 'folder' },
      app: { id: 'app', name: 'App.tsx', type: 'file' },
      main: { id: 'main', name: 'main.tsx', type: 'file' },
      lib: { id: 'lib', name: 'lib', type: 'folder' },
    },
    relationships: {
      [ROOT_ID]: ['src', 'lib'],
      src: ['app', 'main'],
      lib: [],
    },
  })
}

describe('Phase 3 Integration: CRUD + Clipboard + Rename + History', () => {
  function setup() {
    const historyPlugin = history()
    const engine = createCommandEngine(
      fixtureStore(),
      [historyPlugin.middleware!],
      vi.fn()
    )
    return { engine }
  }

  it('create + undo restores original state', () => {
    const { engine } = setup()

    engine.dispatch(crudCommands.create({ id: 'utils', name: 'utils.ts' }, 'lib'))
    expect(getEntity(engine.getStore(), 'utils')).toBeDefined()

    engine.dispatch(undoCommand())
    expect(getEntity(engine.getStore(), 'utils')).toBeUndefined()
  })

  it('delete + undo restores subtree', () => {
    const { engine } = setup()

    engine.dispatch(crudCommands.remove('src'))
    expect(getEntity(engine.getStore(), 'src')).toBeUndefined()
    expect(getEntity(engine.getStore(), 'app')).toBeUndefined()

    engine.dispatch(undoCommand())
    expect(getEntity(engine.getStore(), 'src')).toBeDefined()
    expect(getEntity(engine.getStore(), 'app')).toBeDefined()
    expect(getChildren(engine.getStore(), 'src')).toEqual(['app', 'main'])
  })

  it('copy + paste + undo removes pasted nodes', () => {
    const { engine } = setup()

    engine.dispatch(clipboardCommands.copy(['app']))
    engine.dispatch(clipboardCommands.paste('lib'))

    const libChildren = getChildren(engine.getStore(), 'lib')
    expect(libChildren).toHaveLength(1)

    engine.dispatch(undoCommand())
    expect(getChildren(engine.getStore(), 'lib')).toEqual([])
  })

  it('rename + undo restores original name', () => {
    const { engine } = setup()

    engine.dispatch(renameCommands.startRename('app'))
    engine.dispatch(renameCommands.confirmRename('app', 'name', 'Application.tsx'))
    expect(getEntity(engine.getStore(), 'app')?.name).toBe('Application.tsx')

    engine.dispatch(undoCommand())
    expect(getEntity(engine.getStore(), 'app')?.name).toBe('App.tsx')
  })

  it('full workflow: focus, select, create, rename, delete', () => {
    const { engine } = setup()

    // Focus and expand
    engine.dispatch(focusCommands.setFocus('src'))

    // Create new file
    engine.dispatch(crudCommands.create({ id: 'new1', name: 'new.ts' }, 'src'))
    expect(getChildren(engine.getStore(), 'src')).toEqual(['app', 'main', 'new1'])

    // Rename it
    engine.dispatch(renameCommands.startRename('new1'))
    engine.dispatch(renameCommands.confirmRename('new1', 'name', 'helpers.ts'))
    expect(getEntity(engine.getStore(), 'new1')?.name).toBe('helpers.ts')

    // Delete it
    engine.dispatch(crudCommands.remove('new1'))
    expect(getChildren(engine.getStore(), 'src')).toEqual(['app', 'main'])

    // Undo delete
    engine.dispatch(undoCommand())
    expect(getEntity(engine.getStore(), 'new1')?.name).toBe('helpers.ts')
  })
})

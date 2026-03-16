import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from '../core/command-engine'
import { createStore } from '../core/normalized-store'
import { history, historyCommands } from '../plugins/history'
import type { Command } from '../core/types'

function makeAddCommand(id: string): Command {
  return {
    type: 'test:add',
    payload: { id },
    execute(store) {
      return {
        ...store,
        entities: { ...store.entities, [id]: { id } },
      }
    },
    undo(store) {
      const { [id]: _, ...rest } = store.entities
      return { ...store, entities: rest }
    },
  }
}

describe('history plugin', () => {
  function setup() {
    const onChange = vi.fn()
    const historyPlugin = history()
    const engine = createCommandEngine(
      createStore(),
      [historyPlugin.middleware!],
      onChange
    )
    return { engine, onChange }
  }

  it('undo reverts last command', () => {
    const { engine } = setup()
    engine.dispatch(makeAddCommand('a'))
    expect(engine.getStore().entities['a']).toBeDefined()
    engine.dispatch(historyCommands.undo())
    expect(engine.getStore().entities['a']).toBeUndefined()
  })

  it('redo re-applies undone command', () => {
    const { engine } = setup()
    engine.dispatch(makeAddCommand('a'))
    engine.dispatch(historyCommands.undo())
    engine.dispatch(historyCommands.redo())
    expect(engine.getStore().entities['a']).toBeDefined()
  })

  it('redo stack is cleared on new command', () => {
    const { engine } = setup()
    engine.dispatch(makeAddCommand('a'))
    engine.dispatch(historyCommands.undo())
    engine.dispatch(makeAddCommand('b'))
    engine.dispatch(historyCommands.redo()) // should be no-op
    expect(engine.getStore().entities['a']).toBeUndefined()
    expect(engine.getStore().entities['b']).toBeDefined()
  })

  it('undo with empty history is no-op', () => {
    const { engine } = setup()
    engine.dispatch(historyCommands.undo())
    expect(Object.keys(engine.getStore().entities)).toHaveLength(0)
  })

  it('multiple undo steps', () => {
    const { engine } = setup()
    engine.dispatch(makeAddCommand('a'))
    engine.dispatch(makeAddCommand('b'))
    engine.dispatch(makeAddCommand('c'))
    engine.dispatch(historyCommands.undo())
    expect(engine.getStore().entities['c']).toBeUndefined()
    engine.dispatch(historyCommands.undo())
    expect(engine.getStore().entities['b']).toBeUndefined()
    engine.dispatch(historyCommands.undo())
    expect(engine.getStore().entities['a']).toBeUndefined()
  })
})

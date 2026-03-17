/**
 * Test: Command execute() failure → store rollback.
 * When a command throws during execute, the store must remain unchanged.
 */
import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from '../core/command-engine'
import { createStore } from '../core/normalized-store'
import { ROOT_ID } from '../core/types'
import type { NormalizedData, Command } from '../core/types'

function fixtureStore(): NormalizedData {
  return createStore({
    entities: {
      a: { id: 'a', data: { name: 'A' } },
    },
    relationships: { [ROOT_ID]: ['a'] },
  })
}

function failingCommand(): Command {
  return {
    type: 'test:fail',
    payload: null,
    execute() { throw new Error('boom') },
    undo(store) { return store },
  }
}

function goodCommand(): Command {
  return {
    type: 'test:good',
    payload: null,
    execute(store) {
      return {
        ...store,
        entities: {
          ...store.entities,
          b: { id: 'b', data: { name: 'B' } },
        },
      }
    },
    undo(store) {
      const { b: _, ...rest } = store.entities
      void _
      return { ...store, entities: rest }
    },
  }
}

describe('command-engine error handling', () => {
  it('rolls back store when execute throws', () => {
    const onChange = vi.fn()
    const engine = createCommandEngine(fixtureStore(), [], onChange)

    const storeBefore = engine.getStore()
    engine.dispatch(failingCommand())
    const storeAfter = engine.getStore()

    expect(storeAfter).toBe(storeBefore)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('allows subsequent commands after a failed one', () => {
    const onChange = vi.fn()
    const engine = createCommandEngine(fixtureStore(), [], onChange)

    engine.dispatch(failingCommand())
    engine.dispatch(goodCommand())

    expect(engine.getStore().entities.b).toBeDefined()
    expect(onChange).toHaveBeenCalledTimes(1)
  })
})

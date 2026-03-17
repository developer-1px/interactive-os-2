import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from '../core/createCommandEngine'
import { createStore } from '../core/createStore'
import type { Command, Middleware, NormalizedData } from '../core/types'

function makeAddCommand(id: string, name: string): Command {
  return {
    type: 'test:add',
    payload: { id, name },
    execute(store) {
      return {
        ...store,
        entities: { ...store.entities, [id]: { id, data: { name } } },
      }
    },
    undo(store) {
      const { [id]: _, ...rest } = store.entities
      return { ...store, entities: rest }
    },
  }
}

describe('createCommandEngine', () => {
  it('dispatches a command and updates store', () => {
    const onChange = vi.fn()
    const engine = createCommandEngine(createStore(), [], onChange)
    engine.dispatch(makeAddCommand('a', 'Alpha'))
    expect(engine.getStore().entities['a']).toEqual({ id: 'a', data: { name: 'Alpha' } })
    expect(onChange).toHaveBeenCalledOnce()
  })

  it('calls onStoreChange with new store state', () => {
    const onChange = vi.fn()
    const engine = createCommandEngine(createStore(), [], onChange)
    engine.dispatch(makeAddCommand('a', 'Alpha'))
    const newStore = onChange.mock.calls[0]![0] as NormalizedData
    expect(newStore.entities['a']).toEqual({ id: 'a', data: { name: 'Alpha' } })
  })

  it('middleware can intercept commands', () => {
    const log: string[] = []
    const logger: Middleware = (next) => (command) => {
      log.push(`before:${command.type}`)
      next(command)
      log.push(`after:${command.type}`)
    }
    const engine = createCommandEngine(createStore(), [logger], vi.fn())
    engine.dispatch(makeAddCommand('a', 'Alpha'))
    expect(log).toEqual(['before:test:add', 'after:test:add'])
  })

  it('middleware can block commands', () => {
    const blocker: Middleware = (_next) => (_command) => { }
    const onChange = vi.fn()
    const engine = createCommandEngine(createStore(), [blocker], onChange)
    engine.dispatch(makeAddCommand('a', 'Alpha'))
    expect(engine.getStore().entities['a']).toBeUndefined()
    expect(onChange).not.toHaveBeenCalled()
  })

  it('middleware chain runs outside-in', () => {
    const order: number[] = []
    const first: Middleware = (next) => (cmd) => { order.push(1); next(cmd) }
    const second: Middleware = (next) => (cmd) => { order.push(2); next(cmd) }
    const engine = createCommandEngine(createStore(), [first, second], vi.fn())
    engine.dispatch(makeAddCommand('a', 'Alpha'))
    expect(order).toEqual([1, 2])
  })

  it('multiple dispatches accumulate state', () => {
    const engine = createCommandEngine(createStore(), [], vi.fn())
    engine.dispatch(makeAddCommand('a', 'Alpha'))
    engine.dispatch(makeAddCommand('b', 'Beta'))
    expect(Object.keys(engine.getStore().entities)).toEqual(['a', 'b'])
  })
})

// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { createCommandEngine } from './createCommandEngine'
import { buildRegistry } from './types'
import type { NormalizedData } from '../store/types'

const makeStore = (): NormalizedData => ({
  entities: {
    __focus__: { id: '__focus__', focusedId: 'a' },
    a: { id: 'a', data: { label: 'A' } },
  },
  relationships: { __root__: ['a'] },
})

const setFocus = {
  type: 'test:setFocus',
  handler: (store: NormalizedData, payload: unknown) => {
    const { id } = payload as { id: string }
    return {
      ...store,
      entities: {
        ...store.entities,
        __focus__: { ...store.entities.__focus__, focusedId: id },
      },
    }
  },
}

const noop = {
  type: 'test:noop',
  handler: (store: NormalizedData) => store,
}

const makeEngine = () => {
  const registry = buildRegistry({ setFocus, noop })
  return createCommandEngine(makeStore(), [], registry, () => {}, { logger: false })
}

describe('engine.subscribeStore', () => {
  it('fires on store-changing dispatch', () => {
    const engine = makeEngine()
    let count = 0
    engine.subscribeStore(() => { count++ })
    engine.dispatch({ type: 'test:setFocus', payload: { id: 'b' } })
    expect(count).toBe(1)
  })

  it('does not fire when dispatch returns identical store', () => {
    const engine = makeEngine()
    let count = 0
    engine.subscribeStore(() => { count++ })
    engine.dispatch({ type: 'test:noop', payload: {} })
    expect(count).toBe(0)
  })

  it('fires on syncStore with a new reference', () => {
    const engine = makeEngine()
    let count = 0
    engine.subscribeStore(() => { count++ })
    engine.syncStore(makeStore())
    expect(count).toBe(1)
  })

  it('does not fire on syncStore with the same reference', () => {
    const engine = makeEngine()
    let count = 0
    engine.subscribeStore(() => { count++ })
    engine.syncStore(engine.getStore())
    expect(count).toBe(0)
  })

  it('unsubscribe stops notifications', () => {
    const engine = makeEngine()
    let count = 0
    const unsub = engine.subscribeStore(() => { count++ })
    unsub()
    engine.dispatch({ type: 'test:setFocus', payload: { id: 'b' } })
    expect(count).toBe(0)
  })

  it('snapshot returned by getStore reflects latest after notify', () => {
    const engine = makeEngine()
    let observedFocus = ''
    engine.subscribeStore(() => {
      observedFocus = (engine.getStore().entities.__focus__!.focusedId as string)
    })
    engine.dispatch({ type: 'test:setFocus', payload: { id: 'b' } })
    expect(observedFocus).toBe('b')
  })
})

// @vitest-environment node
import { describe, it, expect, vi } from 'vitest'
import { createCommandEngine } from './createCommandEngine'
import type { EngineEvent, DispatchEvent } from './types'
import { buildRegistry } from './types'
import type { NormalizedData } from '../store/types'
import * as storeDiffModule from '../store/computeStoreDiff'

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

const throwingCommand = {
  type: 'test:throw',
  handler: (): NormalizedData => {
    throw new Error('boom')
  },
}

const makeEngine = () => {
  const registry = buildRegistry({ setFocus, throwingCommand })
  const onChange = vi.fn()
  const engine = createCommandEngine(makeStore(), [], registry, onChange, { logger: false })
  return { engine, onChange }
}

describe('engine.subscribe', () => {
  it('receives dispatch events', () => {
    const { engine } = makeEngine()
    const events: EngineEvent[] = []
    engine.subscribe((e) => events.push(e))

    engine.dispatch({ type: 'test:setFocus', payload: { id: 'b' } })

    expect(events).toHaveLength(1)
    expect(events[0].kind).toBe('dispatch')
    expect(events[0].seq).toBe(1)
    const e0 = events[0] as DispatchEvent
    expect(e0.command.type).toBe('test:setFocus')
    expect(e0.prev.entities.__focus__.focusedId).toBe('a')
    expect(e0.next.entities.__focus__.focusedId).toBe('b')
  })

  it('does not receive events after unsubscribe', () => {
    const { engine } = makeEngine()
    const events: EngineEvent[] = []
    const unsub = engine.subscribe((e) => events.push(e))

    engine.dispatch({ type: 'test:setFocus', payload: { id: 'b' } })
    unsub()
    engine.dispatch({ type: 'test:setFocus', payload: { id: 'c' } })

    expect(events).toHaveLength(1)
  })

  it('on error, prev === next', () => {
    const { engine } = makeEngine()
    const events: EngineEvent[] = []
    engine.subscribe((e) => events.push(e))

    engine.dispatch({ type: 'test:throw' })

    expect(events).toHaveLength(1)
    const e0 = events[0] as DispatchEvent
    expect(e0.error).toBe('boom')
    expect(e0.prev).toBe(e0.next)
  })

  it('lazy diff: computeStoreDiff is not called until .diff is accessed', () => {
    const spy = vi.spyOn(storeDiffModule, 'computeStoreDiff')
    const { engine } = makeEngine()
    const events: EngineEvent[] = []
    engine.subscribe((e) => events.push(e))

    engine.dispatch({ type: 'test:setFocus', payload: { id: 'b' } })

    // not called yet — lazy
    expect(spy.mock.calls.length).toBe(0)

    // access diff triggers computation
    const diff = (events[0] as DispatchEvent).diff
    expect(spy.mock.calls.length).toBe(1)
    expect(diff.length).toBeGreaterThan(0)

    // second access uses cache — still 1 call
    const diff2 = (events[0] as DispatchEvent).diff
    expect(spy.mock.calls.length).toBe(1)
    expect(diff2).toBe(diff)

    spy.mockRestore()
  })

  it('works with zero subscribers', () => {
    const { engine } = makeEngine()

    // should not throw
    engine.dispatch({ type: 'test:setFocus', payload: { id: 'b' } })

    expect(engine.getStore().entities.__focus__.focusedId).toBe('b')
  })

  it('survives subscriber that throws', () => {
    const { engine } = makeEngine()
    const events: EngineEvent[] = []

    engine.subscribe(() => { throw new Error('bad subscriber') })
    engine.subscribe((e) => events.push(e))

    engine.dispatch({ type: 'test:setFocus', payload: { id: 'b' } })

    // second subscriber still receives the event
    expect(events).toHaveLength(1)
    expect((events[0] as DispatchEvent).command.type).toBe('test:setFocus')
  })

  it('handles unsubscribe during emit', () => {
    const { engine } = makeEngine()
    const events: EngineEvent[] = []
    let unsub: () => void

    unsub = engine.subscribe(() => { unsub() })
    engine.subscribe((e) => events.push(e))

    engine.dispatch({ type: 'test:setFocus', payload: { id: 'b' } })

    // second subscriber still called despite first unsubscribing mid-emit
    expect(events).toHaveLength(1)
  })

  it('handles reentrant dispatch from subscriber', () => {
    const { engine } = makeEngine()
    const seqs: number[] = []
    let dispatched = false

    engine.subscribe((e) => {
      seqs.push(e.seq)
      if (!dispatched) {
        dispatched = true
        engine.dispatch({ type: 'test:setFocus', payload: { id: 'c' } })
      }
    })

    engine.dispatch({ type: 'test:setFocus', payload: { id: 'b' } })

    // both events received with increasing seq
    expect(seqs).toHaveLength(2)
    expect(seqs[0]).toBeLessThan(seqs[1])
    expect(engine.getStore().entities.__focus__.focusedId).toBe('c')
  })
})

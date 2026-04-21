// V1: persistPluginPrd.md
import { describe, it, expect, vi } from 'vitest'
import { loadPersisted, persist } from './persist'
import type { PersistAdapter } from './persist'
import { createCommandEngine } from '../engine/createCommandEngine'
import { buildRegistry } from '../engine/types'
import type { NormalizedData } from '../store/types'

function makeMemoryStorage() {
  const map = new Map<string, string>()
  let setCount = 0
  const adapter: PersistAdapter = {
    getItem: (k: string) => map.get(k) ?? null,
    setItem: (k: string, v: string) => { setCount++; map.set(k, v) },
  }
  return { adapter, map, getSetCount: () => setCount }
}

const makeStore = (label = 'A'): NormalizedData => ({
  entities: {
    __focus__: { id: '__focus__', focusedId: 'a' },
    a: { id: 'a', data: { label } },
  },
  relationships: { __root__: ['a'] },
})

const setLabel = {
  type: 'test:setLabel',
  handler: (store: NormalizedData, payload: unknown) => {
    const { label } = payload as { label: string }
    return {
      ...store,
      entities: {
        ...store.entities,
        a: { ...store.entities.a, data: { label } },
      },
    }
  },
}

type Picked = { label: string }
const pick = (s: NormalizedData): Picked => ({ label: (s.entities.a?.data as { label: string }).label })

describe('persist plugin', () => {
  it('restores picked state synchronously via loadPersisted', () => {
    const { adapter, map } = makeMemoryStorage()
    map.set('k', JSON.stringify({ v: 1, d: { label: 'restored' } }))

    const loaded = loadPersisted<Picked>({ key: 'k', version: 1, storage: adapter })
    expect(loaded).toEqual({ label: 'restored' })
  })

  it('writes picked state after command (debounced)', () => {
    vi.useFakeTimers()
    const { adapter, map } = makeMemoryStorage()
    const plugin = persist<Picked>({ key: 'k', version: 1, pick, storage: adapter, debounce: 200 })
    const registry = buildRegistry({ setLabel })
    const engine = createCommandEngine(makeStore(), [plugin.middleware!], registry, () => {}, { logger: false })

    engine.dispatch({ type: 'test:setLabel', payload: { label: 'B' } })

    expect(map.get('k')).toBeUndefined()

    vi.advanceTimersByTime(200)
    expect(map.get('k')).toBe(JSON.stringify({ v: 1, d: { label: 'B' } }))
    vi.useRealTimers()
  })

  it('skips write when picked is unchanged', () => {
    vi.useFakeTimers()
    const { adapter, getSetCount } = makeMemoryStorage()
    const plugin = persist<Picked>({ key: 'k', version: 1, pick, storage: adapter, debounce: 50 })
    const registry = buildRegistry({ setLabel })
    const engine = createCommandEngine(makeStore('A'), [plugin.middleware!], registry, () => {}, { logger: false })

    engine.dispatch({ type: 'test:setLabel', payload: { label: 'A' } })
    vi.advanceTimersByTime(50)
    const countAfterFirst = getSetCount()
    engine.dispatch({ type: 'test:setLabel', payload: { label: 'A' } })
    vi.advanceTimersByTime(50)
    expect(getSetCount()).toBe(countAfterFirst)
    vi.useRealTimers()
  })

  it('calls migrate when version mismatches', () => {
    const { adapter, map } = makeMemoryStorage()
    map.set('k', JSON.stringify({ v: 0, d: { legacyLabel: 'old' } }))
    let seenOldV: number | null = null
    const migrate = (old: unknown, oldV: number): Picked | undefined => {
      seenOldV = oldV
      return { label: (old as { legacyLabel: string }).legacyLabel }
    }

    const loaded = loadPersisted<Picked>({ key: 'k', version: 1, storage: adapter, migrate })
    expect(seenOldV).toBe(0)
    expect(loaded).toEqual({ label: 'old' })
  })

  it('falls back to undefined when migrate returns undefined', () => {
    const { adapter, map } = makeMemoryStorage()
    map.set('k', JSON.stringify({ v: 0, d: { x: 1 } }))
    const loaded = loadPersisted<Picked>({
      key: 'k', version: 1, storage: adapter,
      migrate: () => undefined,
    })
    expect(loaded).toBeUndefined()
  })

  it('swallows setItem exceptions', () => {
    vi.useFakeTimers()
    const warnMsgs: unknown[] = []
    const warn = vi.spyOn(console, 'warn').mockImplementation((...args) => { warnMsgs.push(args) })
    const storage: PersistAdapter = {
      getItem: () => null,
      setItem: () => { throw new Error('quota') },
    }
    const plugin = persist<Picked>({ key: 'k', version: 1, pick, storage, debounce: 10 })
    const registry = buildRegistry({ setLabel })
    const engine = createCommandEngine(makeStore(), [plugin.middleware!], registry, () => {}, { logger: false })

    expect(() => {
      engine.dispatch({ type: 'test:setLabel', payload: { label: 'Z' } })
      vi.advanceTimersByTime(10)
    }).not.toThrow()
    expect(warnMsgs.length).toBeGreaterThan(0)
    warn.mockRestore()
    vi.useRealTimers()
  })
})

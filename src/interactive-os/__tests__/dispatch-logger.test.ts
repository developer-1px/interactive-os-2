// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { computeStoreDiff, applyDelta } from '../store/computeStoreDiff'
import type { StoreDiff } from '../store/computeStoreDiff'
import { defaultLogger } from '../engine/dispatchLogger'
import type { NormalizedData } from '../store/types'
import type { LogEntry } from '../engine/dispatchLogger'
import { createCommandEngine } from '../engine/createCommandEngine'
import { createStore } from '../store/createStore'
import { focusCommands } from '../plugins/core'
import { createBatchCommand } from '../engine/types'
import type { Command } from '../engine/types'

describe('computeStoreDiff', () => {
  const base: NormalizedData = {
    entities: {
      __focus__: { id: '__focus__', focusedId: 'a' },
      __selection__: { id: '__selection__', selected: ['a', 'b'] },
      item1: { id: 'item1', data: { name: 'Item 1' } },
      item2: { id: 'item2', data: { name: 'Item 2' } },
    },
    relationships: { __root__: ['item1', 'item2'] },
  }

  it('returns empty array when stores are identical', () => {
    expect(computeStoreDiff(base, base)).toEqual([])
  })

  it('detects meta entity value-level change', () => {
    const next = {
      ...base,
      entities: {
        ...base.entities,
        __focus__: { id: '__focus__', focusedId: 'b' },
      },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: '__focus__.focusedId', kind: 'changed', before: 'a', after: 'b' },
    ])
  })

  it('detects user entity added', () => {
    const next = {
      ...base,
      entities: {
        ...base.entities,
        item3: { id: 'item3', data: { name: 'Item 3' } },
      },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: 'entities', kind: 'added', after: { id: 'item3', data: { name: 'Item 3' } } },
    ])
  })

  it('detects user entity removed', () => {
    const { item2: _, ...rest } = base.entities
    const next = { ...base, entities: rest }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: 'entities', kind: 'removed', before: { id: 'item2', data: { name: 'Item 2' } } },
    ])
  })

  it('detects user entity changed (shallow)', () => {
    const next = {
      ...base,
      entities: {
        ...base.entities,
        item1: { id: 'item1', data: { name: 'Updated' } },
      },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: 'entities', kind: 'changed', before: { id: 'item1', data: { name: 'Item 1' } }, after: { id: 'item1', data: { name: 'Updated' } } },
    ])
  })

  it('detects relationship member added', () => {
    const next = {
      ...base,
      relationships: { __root__: ['item1', 'item2', 'item3'] },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: '__root__', kind: 'changed', before: ['item1', 'item2'], after: ['item1', 'item2', 'item3'] },
    ])
  })

  it('detects relationship member removed', () => {
    const next = {
      ...base,
      relationships: { __root__: ['item1'] },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: '__root__', kind: 'changed', before: ['item1', 'item2'], after: ['item1'] },
    ])
  })

  it('detects relationship order change', () => {
    const next = {
      ...base,
      relationships: { __root__: ['item2', 'item1'] },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: '__root__', kind: 'changed', before: ['item1', 'item2'], after: ['item2', 'item1'] },
    ])
  })

  it('stores full entity object in content entity added diff', () => {
    const next = {
      ...base,
      entities: {
        ...base.entities,
        item3: { id: 'item3', data: { name: 'Item 3' } },
      },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: 'entities', kind: 'added', after: { id: 'item3', data: { name: 'Item 3' } } },
    ])
  })

  it('stores full entity object in content entity removed diff', () => {
    const { item2: _removed, ...rest } = base.entities
    const next = { ...base, entities: rest }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: 'entities', kind: 'removed', before: { id: 'item2', data: { name: 'Item 2' } } },
    ])
  })

  it('stores full entity objects in content entity changed diff', () => {
    const next = {
      ...base,
      entities: {
        ...base.entities,
        item1: { id: 'item1', data: { name: 'Updated' } },
      },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: 'entities', kind: 'changed', before: { id: 'item1', data: { name: 'Item 1' } }, after: { id: 'item1', data: { name: 'Updated' } } },
    ])
  })

  it('detects meta entity with multiple changed fields', () => {
    const next = {
      ...base,
      entities: {
        ...base.entities,
        __selection__: { id: '__selection__', selected: ['c'] },
      },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: '__selection__.selected', kind: 'changed', before: ['a', 'b'], after: ['c'] },
    ])
  })
})

describe('applyDelta', () => {
  const base: NormalizedData = {
    entities: {
      __focus__: { id: '__focus__', focusedId: 'a' },
      item1: { id: 'item1', data: { name: 'Item 1' } },
      item2: { id: 'item2', data: { name: 'Item 2' } },
    },
    relationships: { __root__: ['item1', 'item2'] },
  }

  it('reverse: undoes entity add (removes entity)', () => {
    const diff: StoreDiff[] = [
      { path: 'entities', kind: 'added', after: { id: 'item3', data: { name: 'New' } } },
    ]
    const storeWithItem3 = {
      ...base,
      entities: { ...base.entities, item3: { id: 'item3', data: { name: 'New' } } },
    }
    const result = applyDelta(storeWithItem3, diff, 'reverse')
    expect(result.entities['item3']).toBeUndefined()
  })

  it('reverse: undoes entity remove (restores entity)', () => {
    const diff: StoreDiff[] = [
      { path: 'entities', kind: 'removed', before: { id: 'item2', data: { name: 'Item 2' } } },
    ]
    const { item2: _, ...restEntities } = base.entities
    const storeWithoutItem2 = { ...base, entities: restEntities }
    const result = applyDelta(storeWithoutItem2, diff, 'reverse')
    expect(result.entities['item2']).toEqual({ id: 'item2', data: { name: 'Item 2' } })
  })

  it('reverse: undoes entity change (restores before)', () => {
    const diff: StoreDiff[] = [
      { path: 'entities', kind: 'changed', before: { id: 'item1', data: { name: 'Item 1' } }, after: { id: 'item1', data: { name: 'Updated' } } },
    ]
    const storeUpdated = {
      ...base,
      entities: { ...base.entities, item1: { id: 'item1', data: { name: 'Updated' } } },
    }
    const result = applyDelta(storeUpdated, diff, 'reverse')
    expect(result.entities['item1']).toEqual({ id: 'item1', data: { name: 'Item 1' } })
  })

  it('reverse: undoes relationship change (restores order)', () => {
    const diff: StoreDiff[] = [
      { path: '__root__', kind: 'changed', before: ['item1', 'item2'], after: ['item2', 'item1'] },
    ]
    const reordered = { ...base, relationships: { __root__: ['item2', 'item1'] } }
    const result = applyDelta(reordered, diff, 'reverse')
    expect(result.relationships['__root__']).toEqual(['item1', 'item2'])
  })

  it('reverse: undoes meta field change', () => {
    const diff: StoreDiff[] = [
      { path: '__focus__.focusedId', kind: 'changed', before: 'a', after: 'b' },
    ]
    const focused = {
      ...base,
      entities: { ...base.entities, __focus__: { id: '__focus__', focusedId: 'b' } },
    }
    const result = applyDelta(focused, diff, 'reverse')
    expect((result.entities['__focus__'] as Record<string, unknown>)?.focusedId).toBe('a')
  })

  it('forward: re-applies diffs', () => {
    const diff: StoreDiff[] = [
      { path: 'entities', kind: 'added', after: { id: 'item3', data: { name: 'New' } } },
      { path: '__root__', kind: 'changed', before: ['item1', 'item2'], after: ['item1', 'item2', 'item3'] },
    ]
    const result = applyDelta(base, diff, 'forward')
    expect(result.entities['item3']).toEqual({ id: 'item3', data: { name: 'New' } })
    expect(result.relationships['__root__']).toEqual(['item1', 'item2', 'item3'])
  })

  it('reverse: undoes relationship add (removes key)', () => {
    const diff: StoreDiff[] = [
      { path: 'item3', kind: 'added', after: ['child1'] },
    ]
    const withRel = { ...base, relationships: { ...base.relationships, item3: ['child1'] } }
    const result = applyDelta(withRel, diff, 'reverse')
    expect(result.relationships['item3']).toBeUndefined()
  })

  it('reverse: undoes relationship remove (restores key)', () => {
    const diff: StoreDiff[] = [
      { path: '__root__', kind: 'removed', before: ['item1', 'item2'] },
    ]
    const withoutRoot = { ...base, relationships: {} }
    const result = applyDelta(withoutRoot, diff, 'reverse')
    expect(result.relationships['__root__']).toEqual(['item1', 'item2'])
  })
})

describe('defaultLogger', () => {
  it('formats single command as structured string', () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))
    try {
      defaultLogger({
        seq: 1,
        type: 'core:focus',
        payload: { nodeId: 'item1' },
        diff: [{ path: '__focus__.focusedId', kind: 'changed' as const, before: '', after: 'item1' }],
      })
    } finally {
      console.log = origLog
    }
    expect(logs[0]).toContain('[dispatch #1]')
    expect(logs[0]).toContain('core:focus')
    expect(logs[0]).toContain('∆')
  })

  it('formats error command', () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))
    try {
      defaultLogger({
        seq: 3,
        type: 'bad:command',
        payload: {},
        diff: [],
        error: 'Boom',
      })
    } finally {
      console.log = origLog
    }
    expect(logs[0]).toContain('ERROR')
    expect(logs[0]).toContain('Boom')
    expect(logs[0]).toContain('(rollback)')
  })

  it('formats no-change command', () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))
    try {
      defaultLogger({
        seq: 2,
        type: 'core:focus',
        payload: { nodeId: 'item1' },
        diff: [],
      })
    } finally {
      console.log = origLog
    }
    expect(logs[0]).toContain('(no change)')
  })

  it('indents child entries', () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))
    try {
      defaultLogger({
        seq: 2,
        type: 'core:focus',
        payload: { nodeId: 'item1' },
        diff: [],
        parent: 1,
      })
    } finally {
      console.log = origLog
    }
    expect(logs[0]).toMatch(/^\s{2}/)
  })
})

describe('engine logger integration', () => {
  function setup(logger: (entry: LogEntry) => void) {
    const store = createStore({
      entities: {
        item1: { id: 'item1', data: { name: 'A' } },
        item2: { id: 'item2', data: { name: 'B' } },
      },
      relationships: { __root__: ['item1', 'item2'] },
    })
    return createCommandEngine(store, [], () => {}, { logger })
  }

  it('logs single command with seq, type, payload, diff', () => {
    const entries: LogEntry[] = []
    const engine = setup((e) => entries.push(e))

    engine.dispatch(focusCommands.setFocus('item1'))

    expect(entries).toHaveLength(1)
    expect(entries[0]!.seq).toBe(1)
    expect(entries[0]!.type).toBe('core:focus')
    expect(entries[0]!.payload).toEqual({ nodeId: 'item1' })
    expect(entries[0]!.diff.length).toBeGreaterThan(0)
    expect(entries[0]!.parent).toBeUndefined()
    expect(entries[0]!.error).toBeUndefined()
  })

  it('increments seq across dispatches', () => {
    const entries: LogEntry[] = []
    const engine = setup((e) => entries.push(e))

    engine.dispatch(focusCommands.setFocus('item1'))
    engine.dispatch(focusCommands.setFocus('item2'))

    expect(entries[0]!.seq).toBe(1)
    expect(entries[1]!.seq).toBe(2)
  })

  it('logs batch with parent (full diff) + children (type/payload only)', () => {
    const entries: LogEntry[] = []
    const engine = setup((e) => entries.push(e))

    const batch = createBatchCommand([
      focusCommands.setFocus('item1'),
      focusCommands.setFocus('item2'),
    ])
    engine.dispatch(batch)

    expect(entries).toHaveLength(3)
    expect(entries[0]!.type).toBe('batch')
    expect(entries[0]!.diff.length).toBeGreaterThan(0)
    expect(entries[0]!.parent).toBeUndefined()
    const parentSeq = entries[0]!.seq
    expect(entries[1]!.parent).toBe(parentSeq)
    expect(entries[1]!.diff).toEqual([])
    expect(entries[2]!.parent).toBe(parentSeq)
    expect(entries[2]!.diff).toEqual([])
  })

  it('handles nested batch recursively', () => {
    const entries: LogEntry[] = []
    const engine = setup((e) => entries.push(e))

    const inner = createBatchCommand([
      focusCommands.setFocus('item1'),
    ])
    const outer = createBatchCommand([
      inner,
      focusCommands.setFocus('item2'),
    ])
    engine.dispatch(outer)

    // outer(1) → inner(2) → setFocus-item1(3) → setFocus-item2(4)
    expect(entries).toHaveLength(4)
    expect(entries[0]!.type).toBe('batch')
    expect(entries[1]!.type).toBe('batch')
    expect(entries[1]!.parent).toBe(entries[0]!.seq)
    expect(entries[2]!.parent).toBe(entries[0]!.seq)
    expect(entries[3]!.parent).toBe(entries[0]!.seq)
  })

  it('logs no-change command with empty diff', () => {
    const entries: LogEntry[] = []
    const engine = setup((e) => entries.push(e))

    engine.dispatch(focusCommands.setFocus('item1'))
    engine.dispatch(focusCommands.setFocus('item1'))

    expect(entries[1]!.diff).toEqual([])
  })

  it('logs error command with error field', () => {
    const entries: LogEntry[] = []
    const engine = setup((e) => entries.push(e))

    const badCommand: Command = {
      type: 'bad:command',
      payload: {},
      execute() { throw new Error('Boom') },
    }
    engine.dispatch(badCommand)

    expect(entries).toHaveLength(1)
    expect(entries[0]!.error).toBe('Boom')
    expect(entries[0]!.diff).toEqual([])
  })

  it('does not log when logger is false', () => {
    const entries: LogEntry[] = []
    const store = createStore({ entities: {}, relationships: { __root__: [] } })
    const engine = createCommandEngine(store, [], () => {}, { logger: false })
    const engineWithLogger = createCommandEngine(store, [], () => {}, { logger: (e) => entries.push(e) })

    engine.dispatch(focusCommands.setFocus('x'))
    expect(entries).toHaveLength(0)

    engineWithLogger.dispatch(focusCommands.setFocus('x'))
    expect(entries).toHaveLength(1)
  })
})

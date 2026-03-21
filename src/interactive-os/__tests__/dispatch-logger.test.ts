// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { computeStoreDiff } from '../core/computeStoreDiff'
import { defaultLogger } from '../core/dispatchLogger'
import type { NormalizedData } from '../core/types'
import type { LogEntry } from '../core/dispatchLogger'

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
      { path: 'entities', kind: 'added', after: 'item3' },
    ])
  })

  it('detects user entity removed', () => {
    const { item2: _, ...rest } = base.entities
    const next = { ...base, entities: rest }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: 'entities', kind: 'removed', before: 'item2' },
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
      { path: 'entities', kind: 'changed', before: 'item1', after: 'item1' },
    ])
  })

  it('detects relationship added ids', () => {
    const next = {
      ...base,
      relationships: { __root__: ['item1', 'item2', 'item3'] },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: '__root__', kind: 'added', after: 'item3' },
    ])
  })

  it('detects relationship removed ids', () => {
    const next = {
      ...base,
      relationships: { __root__: ['item1'] },
    }
    const diff = computeStoreDiff(base, next)
    expect(diff).toEqual([
      { path: '__root__', kind: 'removed', before: 'item2' },
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

describe('defaultLogger', () => {
  it('formats single command as structured string', () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))

    defaultLogger({
      seq: 1,
      type: 'core:focus',
      payload: { nodeId: 'item1' },
      diff: [{ path: '__focus__.focusedId', kind: 'changed' as const, before: '', after: 'item1' }],
    })

    console.log = origLog
    expect(logs[0]).toContain('[dispatch #1]')
    expect(logs[0]).toContain('core:focus')
    expect(logs[0]).toContain('∆')
  })

  it('formats error command', () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))

    defaultLogger({
      seq: 3,
      type: 'bad:command',
      payload: {},
      diff: [],
      error: 'Boom',
    })

    console.log = origLog
    expect(logs[0]).toContain('ERROR')
    expect(logs[0]).toContain('Boom')
    expect(logs[0]).toContain('(rollback)')
  })

  it('formats no-change command', () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))

    defaultLogger({
      seq: 2,
      type: 'core:focus',
      payload: { nodeId: 'item1' },
      diff: [],
    })

    console.log = origLog
    expect(logs[0]).toContain('(no change)')
  })

  it('indents child entries', () => {
    const logs: string[] = []
    const origLog = console.log
    console.log = (...args: unknown[]) => logs.push(args.join(' '))

    defaultLogger({
      seq: 2,
      type: 'core:focus',
      payload: { nodeId: 'item1' },
      diff: [],
      parent: 1,
    })

    console.log = origLog
    expect(logs[0]).toMatch(/^\s{2}/)
  })
})

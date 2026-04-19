// V1: jsonEditorPrd.md
import { describe, it, expect } from 'vitest'
import { jsonToNormalized } from '../jsonToNormalized'
import { normalizedToJson } from '../normalizedToJson'
import type { JsonValue } from '../jsonToNormalized'

describe('jsonToNormalized / normalizedToJson', () => {
  it('roundtrip nested object', () => {
    const v: JsonValue = {
      app: 'aria',
      version: 3,
      enabled: true,
      nested: { deep: { value: null } },
    }
    expect(normalizedToJson(jsonToNormalized(v))).toEqual(v)
  })

  it('roundtrip nested array', () => {
    const v: JsonValue = [[1, 2], [3, 4], [5]]
    expect(normalizedToJson(jsonToNormalized(v))).toEqual(v)
  })

  it('roundtrip mixed object/array', () => {
    const v: JsonValue = {
      name: 'root',
      items: [
        { id: 1, tags: ['a', 'b'] },
        { id: 2, tags: [] },
      ],
      meta: { active: false, owner: null },
    }
    expect(normalizedToJson(jsonToNormalized(v))).toEqual(v)
  })

  it('roundtrip primitive values', () => {
    expect(normalizedToJson(jsonToNormalized('hello'))).toBe('hello')
    expect(normalizedToJson(jsonToNormalized(42))).toBe(42)
    expect(normalizedToJson(jsonToNormalized(true))).toBe(true)
    expect(normalizedToJson(jsonToNormalized(null))).toBe(null)
  })

  it('throws on cyclic reference', () => {
    const a: Record<string, unknown> = { name: 'a' }
    a.self = a
    expect(() => jsonToNormalized(a as unknown as JsonValue)).toThrow(RangeError)
    expect(() => jsonToNormalized(a as unknown as JsonValue)).toThrow(/cyclic|not JSON/i)
  })

  it('throws on BigInt', () => {
    const v = { big: 10n } as unknown as JsonValue
    expect(() => jsonToNormalized(v)).toThrow(RangeError)
    expect(() => jsonToNormalized(v)).toThrow(/not JSON/)
  })

  it('throws on undefined', () => {
    const v = { u: undefined } as unknown as JsonValue
    expect(() => jsonToNormalized(v)).toThrow(RangeError)
    expect(() => jsonToNormalized(v)).toThrow(/not JSON/)
  })

  it('uses path-based deterministic ids for object children', () => {
    const v: JsonValue = { a: { b: 1 } }
    const store = jsonToNormalized(v)
    expect(store.entities['$.a']).toBeDefined()
    expect(store.entities['$.a.b']).toBeDefined()
  })

  it('uses path-based deterministic ids for array children', () => {
    const v: JsonValue = [10, 20, { x: 1 }]
    const store = jsonToNormalized(v)
    expect(store.entities['$[0]']).toBeDefined()
    expect(store.entities['$[1]']).toBeDefined()
    expect(store.entities['$[2]']).toBeDefined()
    expect(store.entities['$[2].x']).toBeDefined()
  })
})

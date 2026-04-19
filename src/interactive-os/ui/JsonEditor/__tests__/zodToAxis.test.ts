// V1: jsonEditorPrd.md
import { describe, it, expect, vi } from 'vitest'
import { z } from 'zod'
import { zodToAxis, resolveSchemaAt, rerouteDiscriminator } from '../zodToAxis'

describe('zodToAxis — 8종 스키마 매핑', () => {
  it('z.string → { kind: "string" }', () => {
    expect(zodToAxis(z.string())).toEqual({ kind: 'string' })
  })

  it('z.number → { kind: "number" }', () => {
    expect(zodToAxis(z.number())).toEqual({ kind: 'number' })
  })

  it('z.boolean → { kind: "boolean" }', () => {
    expect(zodToAxis(z.boolean())).toEqual({ kind: 'boolean' })
  })

  it('z.null → { kind: "null" }', () => {
    expect(zodToAxis(z.null())).toEqual({ kind: 'null' })
  })

  it('z.enum → { kind: "enum", options }', () => {
    const axis = zodToAxis(z.enum(['a', 'b', 'c']))
    expect(axis.kind).toBe('enum')
    if (axis.kind === 'enum') expect(axis.options).toEqual(['a', 'b', 'c'])
  })

  it('z.object → { kind: "object", shape }', () => {
    const axis = zodToAxis(z.object({ x: z.string(), y: z.number() }))
    expect(axis.kind).toBe('object')
    if (axis.kind === 'object') {
      expect(Object.keys(axis.shape).sort()).toEqual(['x', 'y'])
    }
  })

  it('z.array → { kind: "array", element }', () => {
    const axis = zodToAxis(z.array(z.string()))
    expect(axis.kind).toBe('array')
    if (axis.kind === 'array') {
      expect(zodToAxis(axis.element)).toEqual({ kind: 'string' })
    }
  })

  it('z.discriminatedUnion → { kind: "discriminated", discriminator, options }', () => {
    const schema = z.discriminatedUnion('t', [
      z.object({ t: z.literal('a'), x: z.number() }),
      z.object({ t: z.literal('b'), y: z.string() }),
    ])
    const axis = zodToAxis(schema)
    expect(axis.kind).toBe('discriminated')
    if (axis.kind === 'discriminated') {
      expect(axis.discriminator).toBe('t')
      expect(Object.keys(axis.options).sort()).toEqual(['a', 'b'])
    }
  })
})

describe('zodToAxis — unknown fallback', () => {
  it('z.lazy → unknown + console.warn emitted', () => {
    const messages: unknown[][] = []
    const warn = vi.spyOn(console, 'warn').mockImplementation((...args: unknown[]) => {
      messages.push(args)
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const axis = zodToAxis(z.lazy(() => z.string()) as any)
    expect(axis).toEqual({ kind: 'unknown' })
    expect(messages.length).toBeGreaterThan(0)
    warn.mockRestore()
  })
})

describe('resolveSchemaAt', () => {
  it('descends object shape', () => {
    const schema = z.object({ a: z.object({ b: z.number() }) })
    const resolved = resolveSchemaAt(schema, ['a', 'b'], { a: { b: 3 } })
    expect(resolved && zodToAxis(resolved)).toEqual({ kind: 'number' })
  })

  it('descends array element', () => {
    const schema = z.object({ tags: z.array(z.string()) })
    const resolved = resolveSchemaAt(schema, ['tags', 0], { tags: ['hi'] })
    expect(resolved && zodToAxis(resolved)).toEqual({ kind: 'string' })
  })

  it('reroutes through discriminated union by current data', () => {
    const schema = z.discriminatedUnion('t', [
      z.object({ t: z.literal('a'), x: z.number() }),
      z.object({ t: z.literal('b'), y: z.string() }),
    ])
    const resolved = resolveSchemaAt(schema, ['y'], { t: 'b', y: 'hi' })
    expect(resolved && zodToAxis(resolved)).toEqual({ kind: 'string' })
  })
})

describe('rerouteDiscriminator', () => {
  const schema = z.discriminatedUnion('t', [
    z.object({ t: z.literal('a'), shared: z.string(), onlyA: z.number() }),
    z.object({ t: z.literal('b'), shared: z.string(), onlyB: z.boolean() }),
  ])

  it('preserves shared fields and marks non-shared as orphan', () => {
    const prev = { t: 'a', shared: 'kept', onlyA: 1 }
    const { data, orphanKeys } = rerouteDiscriminator(schema, prev, 'b')
    expect(data).toEqual({ t: 'b', shared: 'kept' })
    expect(orphanKeys).toEqual(['onlyA'])
  })

  it('is no-op when target discriminator value is missing', () => {
    const prev = { t: 'a', shared: 'kept', onlyA: 1 }
    const { data, orphanKeys } = rerouteDiscriminator(schema, prev, 'c')
    expect(data).toBe(prev)
    expect(orphanKeys).toEqual([])
  })
})

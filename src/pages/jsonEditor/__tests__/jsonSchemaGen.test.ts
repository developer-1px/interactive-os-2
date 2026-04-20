import { describe, it, expect } from 'vitest'
import { generateTypeScript, generateZodSchema } from '../jsonSchemaGen'

describe('jsonSchemaGen — Zod', () => {
  it('emits primitives', () => {
    expect(generateZodSchema('x')).toContain('z.string()')
    expect(generateZodSchema(1)).toContain('z.number()')
    expect(generateZodSchema(true)).toContain('z.boolean()')
    expect(generateZodSchema(null)).toContain('z.null()')
  })

  it('emits flat object', () => {
    const src = generateZodSchema({ a: 'x', b: 1, c: true })
    expect(src).toContain('z.object({')
    expect(src).toMatch(/a: z\.string\(\)/)
    expect(src).toMatch(/b: z\.number\(\)/)
    expect(src).toMatch(/c: z\.boolean\(\)/)
  })

  it('emits homogeneous array', () => {
    expect(generateZodSchema(['a', 'b'])).toContain('z.array(z.string())')
  })

  it('emits heterogeneous array as union', () => {
    const src = generateZodSchema([1, 'x'])
    expect(src).toContain('z.array(z.union([')
    expect(src).toContain('z.number()')
    expect(src).toContain('z.string()')
  })

  it('emits nested object', () => {
    const src = generateZodSchema({ outer: { inner: 1 } })
    expect(src).toMatch(/outer: z\.object\(\{[\s\S]*inner: z\.number\(\)/)
  })

  it('quotes non-identifier keys', () => {
    expect(generateZodSchema({ 'weird-key': 1 })).toContain('"weird-key":')
  })

  it('exports schema and inferred type', () => {
    const src = generateZodSchema({ a: 1 }, 'Foo')
    expect(src).toContain('export const FooSchema =')
    expect(src).toContain('export type Foo = z.infer<typeof FooSchema>')
  })
})

describe('jsonSchemaGen — TypeScript', () => {
  it('emits interface for objects', () => {
    const src = generateTypeScript({ a: 'x', b: 1 })
    expect(src).toContain('export interface Root {')
    expect(src).toMatch(/a: string/)
    expect(src).toMatch(/b: number/)
  })

  it('emits type alias for primitives', () => {
    expect(generateTypeScript('x')).toContain('export type Root = string')
    expect(generateTypeScript(1)).toContain('export type Root = number')
  })

  it('emits array types', () => {
    expect(generateTypeScript(['a', 'b'])).toContain('string[]')
  })

  it('emits Array<union> for heterogeneous arrays', () => {
    const src = generateTypeScript([1, 'x'])
    expect(src).toMatch(/Array<(string \| number|number \| string)>/)
  })

  it('emits nested interfaces inline', () => {
    const src = generateTypeScript({ outer: { inner: 1 } })
    expect(src).toMatch(/outer: \{[\s\S]*inner: number/)
  })
})

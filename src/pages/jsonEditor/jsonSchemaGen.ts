import type { JsonValue } from '@os/ui/JsonEditor/jsonToNormalized'

function detectType(v: unknown): 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array' {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  return typeof v as 'string' | 'number' | 'boolean' | 'object'
}

function isIdent(key: string): boolean {
  return /^[A-Za-z_$][A-Za-z0-9_$]*$/.test(key)
}

/** Merge element types of a heterogeneous array into a single schema node. */
function unifyArray(items: JsonValue[], emit: (v: JsonValue, indent: number) => string, indent: number): string {
  if (items.length === 0) return 'z.unknown()'
  const parts = Array.from(new Set(items.map((i) => emit(i, indent))))
  if (parts.length === 1) return parts[0]!
  return `z.union([${parts.join(', ')}])`
}

/** Generate a Zod schema string from a JSON value. */
export function generateZodSchema(value: JsonValue, rootName = 'Root'): string {
  const pad = (n: number) => '  '.repeat(n)
  function emit(v: JsonValue, indent: number): string {
    const t = detectType(v)
    if (t === 'string') return 'z.string()'
    if (t === 'number') return 'z.number()'
    if (t === 'boolean') return 'z.boolean()'
    if (t === 'null') return 'z.null()'
    if (t === 'array') return `z.array(${unifyArray(v as JsonValue[], emit, indent)})`
    const entries = Object.entries(v as Record<string, JsonValue>)
    if (entries.length === 0) return 'z.object({})'
    const lines = entries.map(([k, cv]) => {
      const key = isIdent(k) ? k : JSON.stringify(k)
      return `${pad(indent + 1)}${key}: ${emit(cv, indent + 1)},`
    })
    return `z.object({\n${lines.join('\n')}\n${pad(indent)}})`
  }
  const body = emit(value, 0)
  return `import { z } from 'zod'\n\nexport const ${rootName}Schema = ${body}\n\nexport type ${rootName} = z.infer<typeof ${rootName}Schema>\n`
}

/** Generate a TypeScript interface/type from a JSON value. */
export function generateTypeScript(value: JsonValue, rootName = 'Root'): string {
  const pad = (n: number) => '  '.repeat(n)
  function emit(v: JsonValue, indent: number): string {
    const t = detectType(v)
    if (t === 'string') return 'string'
    if (t === 'number') return 'number'
    if (t === 'boolean') return 'boolean'
    if (t === 'null') return 'null'
    if (t === 'array') {
      const arr = v as JsonValue[]
      if (arr.length === 0) return 'unknown[]'
      const parts = Array.from(new Set(arr.map((i) => emit(i, indent))))
      if (parts.length === 1) return `${parts[0]}[]`
      return `Array<${parts.join(' | ')}>`
    }
    const entries = Object.entries(v as Record<string, JsonValue>)
    if (entries.length === 0) return 'Record<string, never>'
    const lines = entries.map(([k, cv]) => {
      const key = isIdent(k) ? k : JSON.stringify(k)
      return `${pad(indent + 1)}${key}: ${emit(cv, indent + 1)}`
    })
    return `{\n${lines.join('\n')}\n${pad(indent)}}`
  }
  const t = detectType(value)
  const body = emit(value, 0)
  if (t === 'object') return `export interface ${rootName} ${body}\n`
  return `export type ${rootName} = ${body}\n`
}

// ② jsonEditorPrd.md
import type { NormalizedData, Entity } from '../../store/types'
import { ROOT_ID } from '../../store/types'

export type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }

export type JsonType = 'object' | 'array' | 'string' | 'number' | 'boolean' | 'null'

export type JsonPathSegment = string | number

/** Core JSON node fields without TreeGrid-specific `cells`. Does NOT have an index signature. */
export interface JsonNodeCore {
  type: JsonType
  /** parent가 object일 때 key (ROOT 직계 또는 array item은 undefined) */
  key?: string
  /** primitive일 때 원시값. object/array는 undefined */
  value?: string | number | boolean | null
  /** schema 모드에서 discriminator 변경 후 schema에 없는 필드 */
  orphan?: true
  /** path segments from root (object key | array index) */
  path: JsonPathSegment[]
}

export interface JsonNodeData extends JsonNodeCore, Record<string, unknown> {
  /**
   * TreeGrid column-mode가 읽는 보조 배열.
   * [0] = key display ref, [1] = value display ref. renderCell은 value를 통해 ref를 받는다.
   */
  cells: [JsonCellRef, JsonCellRef]
}

export interface JsonCellRef {
  nodeId: string
  column: 'key' | 'value'
  data: JsonNodeCore
}

function detectType(v: unknown): JsonType {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'array'
  const t = typeof v
  if (t === 'object') return 'object'
  if (t === 'string' || t === 'number' || t === 'boolean') return t
  throw new RangeError(`not JSON: ${t}`)
}

function pathId(path: readonly JsonPathSegment[]): string {
  if (path.length === 0) return ROOT_ID
  return (
    '$' +
    path.map(p => (typeof p === 'number' ? `[${p}]` : `.${p}`)).join('')
  )
}

function makeEntity(id: string, core: JsonNodeCore): Entity {
  const data: JsonNodeData = {
    ...core,
    cells: [
      { nodeId: id, column: 'key', data: core },
      { nodeId: id, column: 'value', data: core },
    ],
  }
  return { id, data }
}

/**
 * @invariant roundtrip: normalizedToJson(jsonToNormalized(v)) deepEqual v (6 JSON 타입 한정)
 * @invariant BigInt / undefined / 순환 참조 입력 시 throw RangeError('not JSON')
 * @invariant id 생성은 결정적(path 기반): object 자식 `.key`, array 자식 `[i]`
 */
export function jsonToNormalized(value: JsonValue): NormalizedData {
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = {}
  const seen = new WeakSet<object>()

  function walk(v: JsonValue, path: readonly JsonPathSegment[], key?: string): string {
    if (v && typeof v === 'object') {
      if (seen.has(v)) throw new RangeError('not JSON: cyclic reference')
      seen.add(v)
    }
    const id = pathId(path)
    const type = detectType(v)
    const pathCopy = [...path]

    if (type === 'object') {
      entities[id] = makeEntity(id, { type: 'object', key, path: pathCopy })
      relationships[id] = Object.keys(v as object).map(k =>
        walk((v as Record<string, JsonValue>)[k], [...path, k], k),
      )
    } else if (type === 'array') {
      entities[id] = makeEntity(id, { type: 'array', key, path: pathCopy })
      relationships[id] = (v as JsonValue[]).map((item, i) => walk(item, [...path, i]))
    } else {
      entities[id] = makeEntity(id, {
        type,
        key,
        value: v as string | number | boolean | null,
        path: pathCopy,
      })
    }
    return id
  }

  const rootType = detectType(value)
  if (rootType === 'object' || rootType === 'array') {
    walk(value, [])
    return { entities, relationships }
  }
  // primitive root — wrap as single-child of ROOT so TreeGrid sees a tree.
  entities[ROOT_ID] = makeEntity(ROOT_ID, { type: 'object', path: [] })
  const childId = '$'
  entities[childId] = makeEntity(childId, {
    type: rootType,
    value: value as string | number | boolean | null,
    path: [],
  })
  relationships[ROOT_ID] = [childId]
  return { entities, relationships }
}

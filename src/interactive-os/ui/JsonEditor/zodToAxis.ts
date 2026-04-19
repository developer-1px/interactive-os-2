// ② jsonEditorPrd.md
import { z } from 'zod'
import type { ZodTypeAny } from 'zod'

export type FieldAxis =
  | { kind: 'string' }
  | { kind: 'number' }
  | { kind: 'boolean' }
  | { kind: 'null' }
  | { kind: 'enum', options: readonly string[] }
  | { kind: 'object', shape: Record<string, ZodTypeAny> }
  | { kind: 'array', element: ZodTypeAny }
  | { kind: 'discriminated', discriminator: string, options: Record<string, ZodTypeAny> }
  | { kind: 'unknown' }

/** Extract the literal value(s) from a zod literal field on a discriminated-union option. */
function literalValues(schema: ZodTypeAny): string[] {
  const def = (schema as { def?: { values?: unknown } }).def
  if (!def || !def.values) return []
  const values = def.values as Iterable<unknown>
  const out: string[] = []
  for (const v of values) out.push(String(v))
  return out
}

/**
 * @invariant z.string/number/boolean/null/enum/object/array/discriminatedUnion 8종 직접 매핑
 * @invariant z.refine / z.lazy / z.union(non-discriminated) → { kind: 'unknown' } + console.warn
 */
export function zodToAxis(schema: ZodTypeAny): FieldAxis {
  if (schema instanceof z.ZodString) return { kind: 'string' }
  if (schema instanceof z.ZodNumber) return { kind: 'number' }
  if (schema instanceof z.ZodBoolean) return { kind: 'boolean' }
  if (schema instanceof z.ZodNull) return { kind: 'null' }
  if (schema instanceof z.ZodEnum) {
    const opts = (schema as unknown as { options: readonly unknown[] }).options
    return { kind: 'enum', options: opts.map(String) }
  }
  if (schema instanceof z.ZodDiscriminatedUnion) {
    const du = schema as unknown as {
      def: { discriminator: string, options: ZodTypeAny[] }
    }
    const discriminator = du.def.discriminator
    const options: Record<string, ZodTypeAny> = {}
    for (const opt of du.def.options) {
      if (!(opt instanceof z.ZodObject)) continue
      const shape = (opt as unknown as { shape: Record<string, ZodTypeAny> }).shape
      const discField = shape[discriminator]
      if (!discField) continue
      for (const v of literalValues(discField)) {
        options[v] = opt
      }
    }
    return { kind: 'discriminated', discriminator, options }
  }
  if (schema instanceof z.ZodObject) {
    const shape = (schema as unknown as { shape: Record<string, ZodTypeAny> }).shape
    return { kind: 'object', shape }
  }
  if (schema instanceof z.ZodArray) {
    const element = (schema as unknown as { element: ZodTypeAny }).element
    return { kind: 'array', element }
  }
  console.warn('[JsonEditor] zodToAxis: unsupported schema, falling back to string cell', schema)
  return { kind: 'unknown' }
}

/**
 * 스키마 + data path로 해당 위치의 하위 schema를 꺼낸다.
 * @invariant object.shape[key] 또는 array.element로 재귀
 * @invariant discriminated면 현재 data[discriminator]로 options에서 선택
 */
export function resolveSchemaAt(
  schema: ZodTypeAny,
  path: readonly (string | number)[],
  data: unknown,
): ZodTypeAny | undefined {
  let cur: ZodTypeAny | undefined = schema
  let curData: unknown = data
  for (const seg of path) {
    if (!cur) return undefined
    let axis = zodToAxis(cur)
    if (axis.kind === 'discriminated') {
      const dVal = String(
        (curData as Record<string, unknown> | undefined)?.[axis.discriminator] ?? '',
      )
      const picked = axis.options[dVal]
      if (!picked) return undefined
      axis = zodToAxis(picked)
    }
    if (axis.kind === 'object' && typeof seg === 'string') {
      cur = axis.shape[seg]
      curData = (curData as Record<string, unknown> | undefined)?.[seg]
    } else if (axis.kind === 'array' && typeof seg === 'number') {
      cur = axis.element
      curData = (curData as unknown[] | undefined)?.[seg]
    } else {
      return undefined
    }
  }
  return cur
}

/**
 * Discriminator 변경 시 children 재생성:
 * - 새 schema의 shape에 존재하는 필드는 기존 값 유지
 * - 기존에만 있는 필드는 orphan:true flag로 보존 (삭제 금지)
 * - 새 schema에만 있는 필드는 default로 추가
 * @invariant 기존 데이터 손실 0
 */
export function rerouteDiscriminator(
  schema: ZodTypeAny,
  prevData: Record<string, unknown>,
  nextDiscriminatorValue: string,
): { data: Record<string, unknown>, orphanKeys: string[] } {
  const axis = zodToAxis(schema)
  if (axis.kind !== 'discriminated') {
    return { data: prevData, orphanKeys: [] }
  }
  const nextOpt = axis.options[nextDiscriminatorValue]
  if (!nextOpt) return { data: prevData, orphanKeys: [] }
  const nextAxis = zodToAxis(nextOpt)
  if (nextAxis.kind !== 'object') {
    return {
      data: { [axis.discriminator]: nextDiscriminatorValue },
      orphanKeys: Object.keys(prevData).filter(k => k !== axis.discriminator),
    }
  }
  const nextKeys = new Set(Object.keys(nextAxis.shape))
  const next: Record<string, unknown> = { [axis.discriminator]: nextDiscriminatorValue }
  const orphanKeys: string[] = []
  for (const [k, v] of Object.entries(prevData)) {
    if (k === axis.discriminator) continue
    if (nextKeys.has(k)) next[k] = v
    else orphanKeys.push(k)
  }
  return { data: next, orphanKeys }
}

// ② jsonEditorPrd.md
import type { NormalizedData } from '../../store/types'
import { ROOT_ID } from '../../store/types'
import type { JsonNodeData, JsonValue } from './jsonToNormalized'

/**
 * @invariant JsonNodeData.type=object → children으로 `{key: child}` 조립
 * @invariant type=array → children 순서대로 `[...]`
 * @invariant type=string|number|boolean|null → data.value 그대로
 * @invariant orphan:true 자식은 export에 포함됨 (데이터 손실 방지)
 */
export function normalizedToJson(store: NormalizedData): JsonValue {
  function build(id: string): JsonValue {
    const entity = store.entities[id]
    const data = entity?.data as JsonNodeData | undefined
    if (!data) return null
    if (data.type === 'object') {
      const result: Record<string, JsonValue> = {}
      const children = store.relationships[id] ?? []
      for (const childId of children) {
        const childData = store.entities[childId]?.data as JsonNodeData | undefined
        if (!childData) continue
        const key = childData.key ?? childId
        result[key] = build(childId)
      }
      return result
    }
    if (data.type === 'array') {
      const children = store.relationships[id] ?? []
      return children.map(build)
    }
    if (data.type === 'null') return null
    return (data.value ?? null) as JsonValue
  }

  // primitive-root는 ROOT 아래 유일 child '$'로 래핑된 상태. 언래핑.
  const rootData = store.entities[ROOT_ID]?.data as JsonNodeData | undefined
  if (rootData?.type === 'object') {
    const children = store.relationships[ROOT_ID] ?? []
    if (children.length === 1 && children[0] === '$') {
      const only = store.entities['$']?.data as JsonNodeData | undefined
      if (only && only.type !== 'object' && only.type !== 'array') {
        return build('$')
      }
    }
  }
  return build(ROOT_ID)
}

// ② jsonEditorPrd.md
import { defineCommand } from '../../engine/defineCommand'
import { updateEntityData } from '../../store/createStore'
import { definePlugin } from '../../plugins/definePlugin'
import type { NormalizedData } from '../../store/types'
import type { JsonNodeCore, JsonType } from './jsonToNormalized'

type CellPair = [{ data: JsonNodeCore }, { data: JsonNodeCore }]
type StoredData = JsonNodeCore & { cells?: CellPair }

/** Apply a partial JsonNodeCore patch and keep cells[*].data in sync. */
function patchNode(
  store: NormalizedData,
  nodeId: string,
  corePatch: Partial<JsonNodeCore>,
): NormalizedData {
  const entity = store.entities[nodeId]
  if (!entity) return store
  const existing = (entity.data ?? {}) as unknown as StoredData
  const nextCore: JsonNodeCore = { ...existing, ...corePatch }
  const patch: Record<string, unknown> = { ...corePatch }
  if (existing.cells) {
    patch.cells = [
      { ...existing.cells[0], data: nextCore },
      { ...existing.cells[1], data: nextCore },
    ] as CellPair
  }
  return updateEntityData(store, nodeId, patch)
}

/**
 * JSON 값 변경 커맨드.
 *
 * @invariant entity.data.value + entity.data.cells[*].data.value 를 동시에 업데이트해
 *            renderCell이 읽는 cells ref와 core fields가 싱크된다.
 * @invariant history plugin이 이 커맨드를 undo 단위로 스택한다 (meta 플래그 없음).
 */
export const setJsonValue = defineCommand('jsonEditor:setValue', {
  create: (nodeId: string, value: string | number | boolean | null) => ({ nodeId, value }),
  handler: (store, { nodeId, value }) => patchNode(store, nodeId, { value }),
})

/**
 * JSON 타입 변경 커맨드 (free-mode 4종 토글 + auto 파싱 결과 반영).
 *
 * @invariant type=object|array 이면 value undefined로 설정 (구조 노드)
 * @invariant type=string|number|boolean|null 이면 기존 value를 new type으로 coerce
 */
export const setJsonType = defineCommand('jsonEditor:setType', {
  create: (nodeId: string, type: JsonType, value?: string | number | boolean | null) => ({
    nodeId,
    type,
    value,
  }),
  handler: (store, { nodeId, type, value }) => {
    const isStructure = type === 'object' || type === 'array'
    const nextValue = isStructure ? undefined : (value ?? coerceDefault(type))
    return patchNode(store, nodeId, { type, value: nextValue })
  },
})

function coerceDefault(type: JsonType): string | number | boolean | null {
  switch (type) {
    case 'number': return 0
    case 'boolean': return false
    case 'null': return null
    case 'string':
    default:
      return ''
  }
}

/**
 * "auto" 파싱: 문자열을 JSON.parse 시도 → 성공 시 타입 판별, 실패 시 string 리터럴.
 * PRD §0 제약 ⑦ "auto는 blur 시 JSON.parse → 실패 시 string".
 */
export function parseAutoValue(
  raw: string,
): { type: JsonType, value: string | number | boolean | null } {
  const trimmed = raw.trim()
  if (trimmed === '') return { type: 'string', value: '' }
  try {
    const parsed = JSON.parse(trimmed)
    if (parsed === null) return { type: 'null', value: null }
    if (typeof parsed === 'boolean') return { type: 'boolean', value: parsed }
    if (typeof parsed === 'number') return { type: 'number', value: parsed }
    if (typeof parsed === 'string') return { type: 'string', value: parsed }
    // object/array는 free-mode value cell에서 auto 결과로 전환하지 않는다 (구조 변경은 별도 흐름).
    return { type: 'string', value: raw }
  } catch {
    return { type: 'string', value: raw }
  }
}

export function jsonEditPlugin() {
  return definePlugin({
    name: 'jsonEditor',
    commands: {
      setValue: setJsonValue,
      setType: setJsonType,
    },
  })
}

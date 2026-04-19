// ② inspectorDefinePagePanelPrd.md
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'

/** MVP 편집 대상 — definePage가 소유하는 배치/가시성 축만. surface는 ax()·테마 소유 */
export const EDITABLE_KEYS = ['padding', 'hidden', 'gap'] as const
export type EditableKey = typeof EDITABLE_KEYS[number]

/**
 * LayoutNode data → TreeGrid column mode용 NormalizedData.
 * 각 row entity = { id: `prop:${key}`, data: { cells: [key, String(value)] } }
 * 값이 undefined면 빈 문자열. hidden은 boolean이므로 'true'/'false' 문자열로 직렬화.
 *
 * @invariant EDITABLE_KEYS 순서를 유지한다 (TreeGrid row 순서 결정적)
 */
export function layoutNodeToGridData(nodeData: Record<string, unknown>): NormalizedData {
  const entities: Record<string, Entity> = {}
  const children: string[] = []

  for (const key of EDITABLE_KEYS) {
    const rowId = `prop:${key}`
    const raw = nodeData[key]
    const value = raw === undefined ? '' : String(raw)
    entities[rowId] = { id: rowId, data: { cells: [key, value] } }
    children.push(rowId)
  }

  return { entities, relationships: { [ROOT_ID]: children } }
}

/**
 * TreeGrid onChange에서 받은 갱신 store → LayoutNode patch (부분).
 * 값 파싱: padding/gap은 enum 문자열 그대로, hidden은 'true'→true/'false'→false.
 * 빈 문자열은 해당 키를 제거(undefined)로 해석.
 *
 * @invariant EDITABLE_KEYS에 없는 키는 patch에 포함하지 않는다
 */
export function gridDataToLayoutPatch(grid: NormalizedData): Record<string, unknown> {
  const patch: Record<string, unknown> = {}
  for (const key of EDITABLE_KEYS) {
    const row = grid.entities[`prop:${key}`]
    const cells = (row?.data as { cells?: unknown[] } | undefined)?.cells
    if (!Array.isArray(cells) || cells.length < 2) continue
    const raw = cells[1]
    if (raw === '' || raw === undefined) {
      patch[key] = undefined
      continue
    }
    if (key === 'hidden') {
      patch[key] = raw === 'true' || raw === true
    } else {
      patch[key] = raw
    }
  }
  return patch
}

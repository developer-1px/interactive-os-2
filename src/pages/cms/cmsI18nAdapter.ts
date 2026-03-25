import type { NormalizedData } from '../../interactive-os/store/types'
import { ROOT_ID } from '../../interactive-os/store/types'
import { localeFieldsOf } from './cms-schema'
import { LOCALES } from './cms-types'
import type { LocaleMap } from './cms-types'

export const I18N_COLUMNS: { key: string; header: string; width?: string }[] = [
  { key: 'key', header: 'KEY', width: '200px' },
  ...LOCALES.map(l => ({ key: l, header: l.toUpperCase() })),
]

export function translatableEntriesToGrid(store: NormalizedData): NormalizedData {
  const rows: string[] = []
  const entities: NormalizedData['entities'] = {}

  for (const [id, entity] of Object.entries(store.entities)) {
    if (id.startsWith('__')) continue
    const d = entity.data as Record<string, unknown> | undefined
    if (!d) continue
    const type = d.type as string | undefined
    if (!type) continue
    for (const field of localeFieldsOf(type)) {
      const value = d[field]
      if (value && typeof value === 'object' && 'ko' in value) {
        const localeMap = value as LocaleMap
        const rowId = `${id}::${field}`
        rows.push(rowId)
        entities[rowId] = {
          id: rowId,
          data: {
            cells: [`${id}.${field}`, ...LOCALES.map(l => localeMap[l] ?? '')],
            sourceEntityId: id,
            sourceField: field,
          },
        }
      }
    }
  }

  return {
    entities,
    relationships: { [ROOT_ID]: rows },
  }
}

/**
 * Grid 변경 → CMS store 업데이트 명령 목록을 반환.
 * 셀 diff를 감지하여 변경된 locale 값을 원본 entity의 LocaleMap에 반영하는 데 필요한 정보를 반환.
 */
export function diffGridChanges(
  prev: NormalizedData,
  next: NormalizedData,
  cmsStore: NormalizedData,
): Array<{ entityId: string; field: string; updatedMap: LocaleMap }> {
  const changes: Array<{ entityId: string; field: string; updatedMap: LocaleMap }> = []

  for (const [rowId, entity] of Object.entries(next.entities)) {
    if (rowId.startsWith('__')) continue
    const prevEntity = prev.entities[rowId]
    if (!prevEntity) continue
    const newCells = (entity.data as Record<string, unknown>)?.cells as string[] | undefined
    const prevCells = (prevEntity.data as Record<string, unknown>)?.cells as string[] | undefined
    if (!newCells || !prevCells) continue

    for (let i = 1; i < newCells.length; i++) {
      if (newCells[i] !== prevCells[i]) {
        const meta = getRowMetadata(next, rowId)
        if (!meta) continue
        const locale = LOCALES[i - 1]
        if (!locale) continue
        const currentMap = (cmsStore.entities[meta.sourceEntityId]?.data as Record<string, unknown>)?.[meta.sourceField] as LocaleMap
        if (!currentMap) continue
        changes.push({
          entityId: meta.sourceEntityId,
          field: meta.sourceField,
          updatedMap: { ...currentMap, [locale]: newCells[i]! },
        })
      }
    }
  }

  return changes
}

export function getRowMetadata(
  gridData: NormalizedData,
  rowId: string,
): { sourceEntityId: string; sourceField: string } | null {
  const row = gridData.entities[rowId]
  if (!row) return null
  const d = row.data as Record<string, unknown>
  const sourceEntityId = d?.sourceEntityId as string | undefined
  const sourceField = d?.sourceField as string | undefined
  if (!sourceEntityId || !sourceField) return null
  return { sourceEntityId, sourceField }
}

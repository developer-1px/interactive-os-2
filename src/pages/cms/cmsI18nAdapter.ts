import type { NormalizedData } from '../../interactive-os/core/types'
import { ROOT_ID } from '../../interactive-os/core/types'
import { localeFieldsOf } from './cms-schema'
import { LOCALES } from './cms-types'
import type { LocaleMap } from './cms-types'

export const I18N_COLUMNS = [
  { key: 'key', header: 'Key' },
  ...LOCALES.map(l => ({ key: l, header: l })),
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

import { describe, it, expect } from 'vitest'
import { translatableEntriesToGrid, I18N_COLUMNS, getRowMetadata, diffGridChanges } from '../pages/cms/cmsI18nAdapter'
import { createStore } from '../interactive-os/store/createStore'
import { ROOT_ID, type NormalizedData } from '../interactive-os/store/types'

function cmsFixture(): NormalizedData {
  return createStore({
    entities: {
      'hero-title': {
        id: 'hero-title',
        data: { type: 'text', value: { ko: '제목', en: 'Title', ja: '' } },
      },
      'hero-subtitle': {
        id: 'hero-subtitle',
        data: { type: 'text', value: { ko: '부제', en: '', ja: '' } },
      },
      '__focus__': { id: '__focus__', focusedId: 'hero-title' },
    },
    relationships: {
      [ROOT_ID]: ['hero-title', 'hero-subtitle'],
    },
  })
}

describe('translatableEntriesToGrid', () => {
  it('converts CMS store to Grid NormalizedData', () => {
    const result = translatableEntriesToGrid(cmsFixture())
    const children = result.relationships[ROOT_ID] ?? []
    expect(children.length).toBe(2)
    const firstRow = result.entities[children[0]!]
    const cells = (firstRow?.data as Record<string, unknown>)?.cells as string[]
    expect(cells).toEqual(['hero-title.value', '제목', 'Title', ''])
  })

  it('returns empty grid for store with no translatable entries', () => {
    const empty = createStore({ entities: {}, relationships: { [ROOT_ID]: [] } })
    const result = translatableEntriesToGrid(empty)
    expect(result.relationships[ROOT_ID]).toEqual([])
  })

  it('skips internal entities (__ prefix)', () => {
    const result = translatableEntriesToGrid(cmsFixture())
    const children = result.relationships[ROOT_ID] ?? []
    const ids = children.map(id => result.entities[id]?.id)
    expect(ids.every(id => id && !id.startsWith('__'))).toBe(true)
  })

  it('columns include Key + all locales', () => {
    expect(I18N_COLUMNS.map(c => c.key)).toEqual(['key', 'ko', 'en', 'ja'])
  })

  it('V9: entity removal reduces grid rows', () => {
    const store = cmsFixture()
    const full = translatableEntriesToGrid(store)
    expect(full.relationships[ROOT_ID]?.length).toBe(2)

    // Remove hero-subtitle from store
    const { 'hero-subtitle': _removed, ...remainingEntities } = store.entities
    void _removed
    const reduced = translatableEntriesToGrid({
      entities: remainingEntities,
      relationships: { [ROOT_ID]: ['hero-title'] },
    })
    expect(reduced.relationships[ROOT_ID]?.length).toBe(1)
    expect(reduced.relationships[ROOT_ID]?.[0]).toContain('hero-title')
  })

  it('V5: diffGridChanges detects cell edit and maps to CMS entity', () => {
    const store = cmsFixture()
    const prev = translatableEntriesToGrid(store)

    // Simulate Grid rename: change en column (index 2) of hero-title.value
    const rowId = 'hero-title::value'
    const next: NormalizedData = {
      ...prev,
      entities: {
        ...prev.entities,
        [rowId]: {
          ...prev.entities[rowId]!,
          data: {
            ...(prev.entities[rowId]!.data as Record<string, unknown>),
            cells: ['hero-title.value', '제목', 'New Title', ''], // en changed
          },
        },
      },
    }

    const changes = diffGridChanges(prev, next, store)
    expect(changes.length).toBe(1)
    expect(changes[0]).toEqual({
      entityId: 'hero-title',
      field: 'value',
      updatedMap: { ko: '제목', en: 'New Title', ja: '' },
    })
  })

  it('V5: diffGridChanges returns empty for no changes', () => {
    const store = cmsFixture()
    const gridData = translatableEntriesToGrid(store)
    const changes = diffGridChanges(gridData, gridData, store)
    expect(changes).toEqual([])
  })

  it('getRowMetadata extracts sourceEntityId, sourceField from row', () => {
    const result = translatableEntriesToGrid(cmsFixture())
    const children = result.relationships[ROOT_ID] ?? []
    const meta = getRowMetadata(result, children[0]!)
    expect(meta).toEqual({ sourceEntityId: 'hero-title', sourceField: 'value' })
  })
})

import { describe, it, expect } from 'vitest'
import { translatableEntriesToGrid, I18N_COLUMNS, getRowMetadata } from '../pages/cms/cmsI18nAdapter'
import { createStore } from '../interactive-os/core/createStore'
import { ROOT_ID, type NormalizedData } from '../interactive-os/core/types'

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

  it('getRowMetadata extracts sourceEntityId, sourceField from row', () => {
    const result = translatableEntriesToGrid(cmsFixture())
    const children = result.relationships[ROOT_ID] ?? []
    const meta = getRowMetadata(result, children[0]!)
    expect(meta).toEqual({ sourceEntityId: 'hero-title', sourceField: 'value' })
  })
})

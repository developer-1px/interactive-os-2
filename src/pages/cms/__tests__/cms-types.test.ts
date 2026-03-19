import { describe, it, expect } from 'vitest'
import { localeMap, localized } from '../cms-types'

describe('localeMap', () => {
  it('creates map with ko value, empty en/ja', () => {
    const m = localeMap('제목')
    expect(m).toEqual({ ko: '제목', en: '', ja: '' })
  })
})

describe('localized', () => {
  it('returns locale value when present', () => {
    const m = { ko: '제목', en: 'Title', ja: '' }
    expect(localized(m, 'en')).toEqual({ text: 'Title', isFallback: false })
  })
  it('falls back to ko when locale is empty', () => {
    const m = { ko: '제목', en: '', ja: '' }
    expect(localized(m, 'ja')).toEqual({ text: '제목', isFallback: true })
  })
  it('handles plain string (non-localized)', () => {
    expect(localized('14', 'en')).toEqual({ text: '14', isFallback: false })
  })
})

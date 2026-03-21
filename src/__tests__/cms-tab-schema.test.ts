import { describe, it, expect } from 'vitest'
import { cmsCanAccept, getEditableFields } from '../pages/cms/cms-schema'

describe('CMS Tab Container Schema', () => {
  it('root accepts tab-group', () => {
    expect(cmsCanAccept(undefined, { type: 'tab-group' })).toBe(true)
  })

  it('root still accepts section', () => {
    expect(cmsCanAccept(undefined, { type: 'section', variant: 'hero' })).toBe(true)
  })

  it('tab-group accepts tab-item', () => {
    expect(cmsCanAccept({ type: 'tab-group' }, { type: 'tab-item', label: { ko: '탭', en: '', ja: '' } })).toBe(true)
  })

  it('tab-group rejects section', () => {
    expect(cmsCanAccept({ type: 'tab-group' }, { type: 'section', variant: 'hero' })).toBe(false)
  })

  it('tab-item accepts tab-panel', () => {
    expect(cmsCanAccept({ type: 'tab-item', label: { ko: '', en: '', ja: '' } }, { type: 'tab-panel' })).toBe(true)
  })

  it('tab-item rejects text', () => {
    expect(cmsCanAccept({ type: 'tab-item', label: { ko: '', en: '', ja: '' } }, { type: 'text', role: 'title', value: { ko: '', en: '', ja: '' } })).toBe(false)
  })

  it('tab-panel accepts section', () => {
    expect(cmsCanAccept({ type: 'tab-panel' }, { type: 'section', variant: 'hero' })).toBe(true)
  })

  it('tab-panel rejects tab-group (no nesting)', () => {
    expect(cmsCanAccept({ type: 'tab-panel' }, { type: 'tab-group' })).toBe(false)
  })

  it('tab-panel rejects card directly', () => {
    expect(cmsCanAccept({ type: 'tab-panel' }, { type: 'card' })).toBe(false)
  })

  it('tab-item has label as editable field', () => {
    const fields = getEditableFields({ type: 'tab-item', label: { ko: '탭', en: '', ja: '' } })
    expect(fields).toEqual([{ field: 'label', label: 'Label', isLocaleMap: true }])
  })

  it('tab-group has no editable fields', () => {
    expect(getEditableFields({ type: 'tab-group' })).toEqual([])
  })

  it('tab-panel has no editable fields', () => {
    expect(getEditableFields({ type: 'tab-panel' })).toEqual([])
  })
})

import { describe, it, expect } from 'vitest'
import { createSection, TEMPLATE_VARIANTS } from '../cms-templates'

describe('createSection', () => {
  it('creates hero section with 4 children', () => {
    const { entities, relationships, rootId } = createSection('hero')
    expect(entities[rootId].data.type).toBe('section')
    expect(entities[rootId].data.variant).toBe('hero')
    expect(relationships[rootId].length).toBe(4) // badge, title, subtitle, cta
  })

  it('generates unique IDs each call', () => {
    const a = createSection('hero')
    const b = createSection('hero')
    expect(a.rootId).not.toBe(b.rootId)
  })

  it('creates stats section with 4 stat children', () => {
    const { relationships, rootId } = createSection('stats')
    expect(relationships[rootId].length).toBe(4)
  })

  it('all text values are LocaleMap', () => {
    const { entities } = createSection('hero')
    const titleEntity = Object.values(entities).find(
      e => (e.data as Record<string, unknown>).type === 'text'
    )
    const data = titleEntity!.data as Record<string, unknown>
    expect(data.value).toHaveProperty('ko')
    expect(data.value).toHaveProperty('en')
  })

  it('has all 6 variants', () => {
    expect(TEMPLATE_VARIANTS).toHaveLength(6)
    for (const v of TEMPLATE_VARIANTS) {
      const result = createSection(v.id)
      expect(result.entities[result.rootId]).toBeDefined()
    }
  })
})

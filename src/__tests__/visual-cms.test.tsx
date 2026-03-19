import { describe, it, expect } from 'vitest'
import { createStore, getChildren, getEntity, addEntity, removeEntity, moveNode } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import { cmsStore } from '../pages/PageVisualCms'

describe('unified CMS store', () => {
  it('has 6 sections as ROOT children', () => {
    const children = getChildren(cmsStore, ROOT_ID)
    expect(children).toEqual(['hero', 'stats', 'features', 'workflow', 'patterns', 'footer'])
  })

  it('hero has title, subtitle, cta', () => {
    expect(getChildren(cmsStore, 'hero')).toEqual(['hero-title', 'hero-subtitle', 'hero-cta'])
  })

  it('stats has 4 items', () => {
    expect(getChildren(cmsStore, 'stats')).toHaveLength(4)
  })

  it('features has 4 cards each with 3 children', () => {
    const cards = getChildren(cmsStore, 'features')
    expect(cards).toHaveLength(4)
    for (const cardId of cards) {
      expect(getChildren(cmsStore, cardId)).toHaveLength(3)
    }
  })

  it('patterns has 14 items', () => {
    expect(getChildren(cmsStore, 'patterns')).toHaveLength(14)
  })

  it('footer has brand and links', () => {
    const children = getChildren(cmsStore, 'footer')
    expect(children).toEqual(['footer-brand', 'footer-links'])
  })

  it('footer-links has 3 link items', () => {
    expect(getChildren(cmsStore, 'footer-links')).toHaveLength(3)
  })
})

describe('Visual CMS store mapping', () => {
  const store = createStore({
    entities: {
      hero: { id: 'hero', data: { type: 'section', variant: 'hero' } },
      'hero-title': { id: 'hero-title', data: { type: 'text', value: 'Title', role: 'title' } },
      'hero-subtitle': { id: 'hero-subtitle', data: { type: 'text', value: 'Sub', role: 'subtitle' } },
      features: { id: 'features', data: { type: 'section', variant: 'cards' } },
      'features-heading': { id: 'features-heading', data: { type: 'text', value: 'Features', role: 'heading' } },
      'card-1': { id: 'card-1', data: { type: 'card' } },
      'card-1-icon': { id: 'card-1-icon', data: { type: 'icon', value: '⚡' } },
      'card-1-title': { id: 'card-1-title', data: { type: 'text', value: 'Fast', role: 'title' } },
      'card-1-desc': { id: 'card-1-desc', data: { type: 'text', value: 'Desc', role: 'body' } },
      tabs: { id: 'tabs', data: { type: 'section', variant: 'tabs' } },
      'tab-1': { id: 'tab-1', data: { type: 'tab' } },
      'tab-1-label': { id: 'tab-1-label', data: { type: 'text', value: 'Tab 1', role: 'label' } },
      'tab-item-1': { id: 'tab-item-1', data: { type: 'card' } },
      'tab-item-1-icon': { id: 'tab-item-1-icon', data: { type: 'icon', value: '🔧' } },
      'tab-item-1-title': { id: 'tab-item-1-title', data: { type: 'text', value: 'API', role: 'title' } },
      footer: { id: 'footer', data: { type: 'section', variant: 'footer' } },
      'footer-copy': { id: 'footer-copy', data: { type: 'text', value: '© 2026', role: 'copyright' } },
    },
    relationships: {
      [ROOT_ID]: ['hero', 'features', 'tabs', 'footer'],
      hero: ['hero-title', 'hero-subtitle'],
      features: ['features-heading', 'card-1'],
      'card-1': ['card-1-icon', 'card-1-title', 'card-1-desc'],
      tabs: ['tab-1'],
      'tab-1': ['tab-1-label', 'tab-item-1'],
      'tab-item-1': ['tab-item-1-icon', 'tab-item-1-title'],
      footer: ['footer-copy'],
    },
  })

  it('has 4 root-level sections', () => {
    expect(getChildren(store, ROOT_ID)).toEqual(['hero', 'features', 'tabs', 'footer'])
  })

  it('hero has field-level children (title, subtitle)', () => {
    expect(getChildren(store, 'hero')).toEqual(['hero-title', 'hero-subtitle'])
  })

  it('card has field-level children (icon, title, desc)', () => {
    expect(getChildren(store, 'card-1')).toEqual(['card-1-icon', 'card-1-title', 'card-1-desc'])
  })

  it('tab has label + nested cards (4 levels deep: tabs → tab → card → field)', () => {
    expect(getChildren(store, 'tabs')).toEqual(['tab-1'])
    expect(getChildren(store, 'tab-1')).toEqual(['tab-1-label', 'tab-item-1'])
    expect(getChildren(store, 'tab-item-1')).toEqual(['tab-item-1-icon', 'tab-item-1-title'])
  })

  it('field entities have type-specific data', () => {
    const textField = getEntity(store, 'hero-title')
    expect(textField?.data?.type).toBe('text')
    expect(textField?.data?.value).toBe('Title')
    expect(textField?.data?.role).toBe('title')

    const iconField = getEntity(store, 'card-1-icon')
    expect(iconField?.data?.type).toBe('icon')
    expect(iconField?.data?.value).toBe('⚡')
  })

  it('container entities have structural data only', () => {
    const card = getEntity(store, 'card-1')
    expect(card?.data?.type).toBe('card')
    expect(card?.data).not.toHaveProperty('title')

    const section = getEntity(store, 'hero')
    expect(section?.data?.type).toBe('section')
    expect(section?.data?.variant).toBe('hero')
  })
})

describe('Visual CMS field-level CRUD', () => {
  const store = createStore({
    entities: {
      'card-1': { id: 'card-1', data: { type: 'card' } },
      'card-1-icon': { id: 'card-1-icon', data: { type: 'icon', value: '⚡' } },
      'card-1-title': { id: 'card-1-title', data: { type: 'text', value: 'Fast', role: 'title' } },
      'card-1-desc': { id: 'card-1-desc', data: { type: 'text', value: 'Desc', role: 'body' } },
    },
    relationships: {
      [ROOT_ID]: ['card-1'],
      'card-1': ['card-1-icon', 'card-1-title', 'card-1-desc'],
    },
  })

  it('adds a new text field to card', () => {
    const newField = { id: 'card-1-link', data: { type: 'text', value: 'Learn more', role: 'body' } }
    const result = addEntity(store, newField, 'card-1')
    expect(getChildren(result, 'card-1')).toEqual(['card-1-icon', 'card-1-title', 'card-1-desc', 'card-1-link'])
  })

  it('removes a field — sibling fields preserved', () => {
    const result = removeEntity(store, 'card-1-icon')
    expect(getChildren(result, 'card-1')).toEqual(['card-1-title', 'card-1-desc'])
  })

  it('reorders fields within card', () => {
    const result = moveNode(store, 'card-1-desc', 'card-1', 0)
    expect(getChildren(result, 'card-1')).toEqual(['card-1-desc', 'card-1-icon', 'card-1-title'])
  })

  it('adds image field to card', () => {
    const imgField = { id: 'card-1-img', data: { type: 'image', src: 'test.png', alt: 'test' } }
    const result = addEntity(store, imgField, 'card-1')
    expect(getChildren(result, 'card-1')).toContain('card-1-img')
    expect(getEntity(result, 'card-1-img')?.data?.type).toBe('image')
  })
})

import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { createStore, getChildren, getEntity, addEntity, removeEntity, moveNode } from '../interactive-os/core/createStore'
import { ROOT_ID } from '../interactive-os/core/types'
import { cmsStore } from '../pages/cms-store'
import PageVisualCms from '../pages/PageVisualCms'

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

// ── Spatial navigation (jsdom-compatible: Enter, Escape, Space, Home, End) ──

function getFocused(container: HTMLElement): string {
  return container.querySelector('[tabindex="0"][data-node-id]')?.getAttribute('data-node-id') ?? ''
}

describe('Visual CMS spatial navigation', () => {
  it('initial focus is first section (hero)', () => {
    const { container } = render(<PageVisualCms />)
    expect(getFocused(container as HTMLElement)).toBe('hero')
  })

  it('Enter drills into section, Escape returns', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    // Focus hero (initial focus), then Enter to drill in
    const hero = (container as HTMLElement).querySelector('[data-node-id="hero"]') as HTMLElement
    hero.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container as HTMLElement)).toBe('hero-title')

    // Escape returns to hero
    const focused = (container as HTMLElement).querySelector('[tabindex="0"][data-node-id]') as HTMLElement
    focused.focus()
    await user.keyboard('{Escape}')
    expect(getFocused(container as HTMLElement)).toBe('hero')
  })

  it('Space toggles selection', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const hero = (container as HTMLElement).querySelector('[data-node-id="hero"]') as HTMLElement
    hero.focus()
    await user.keyboard(' ')
    expect(hero.getAttribute('aria-selected')).toBe('true')
  })

  it('Home/End navigate to first/last at current depth', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const hero = (container as HTMLElement).querySelector('[data-node-id="hero"]') as HTMLElement
    hero.focus()
    await user.keyboard('{End}')
    expect(getFocused(container as HTMLElement)).toBe('footer')
    const footer = (container as HTMLElement).querySelector('[data-node-id="footer"]') as HTMLElement
    footer.focus()
    await user.keyboard('{Home}')
    expect(getFocused(container as HTMLElement)).toBe('hero')
  })

  it('all nodes are always visible in the DOM', () => {
    const { container } = render(<PageVisualCms />)
    // Check that some deep nodes are rendered even without Enter
    expect((container as HTMLElement).querySelector('[data-node-id="stat-patterns"]')).toBeTruthy()
    expect((container as HTMLElement).querySelector('[data-node-id="card-store"]')).toBeTruthy()
    expect((container as HTMLElement).querySelector('[data-node-id="pat-treegrid"]')).toBeTruthy()
    expect((container as HTMLElement).querySelector('[data-node-id="footer-brand"]')).toBeTruthy()
  })

  it('click on node focuses it', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const patterns = (container as HTMLElement).querySelector('[data-node-id="patterns"]') as HTMLElement
    await user.click(patterns)
    expect(getFocused(container as HTMLElement)).toBe('patterns')
  })
})

// ── PRD universal rules (jsdom-compatible) ──

describe('PRD — universal rules (jsdom-compatible)', () => {
  // T4: Enter drills into children, first child focused
  it('T4: Enter on section focuses first child', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const features = (container as HTMLElement).querySelector('[data-node-id="features"]') as HTMLElement
    features.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container as HTMLElement)).toBe('card-store')
  })

  // T5: Escape returns to parent depth
  it('T5: Escape from child returns to parent', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    // Enter features → focus card-store
    const features = (container as HTMLElement).querySelector('[data-node-id="features"]') as HTMLElement
    features.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container as HTMLElement)).toBe('card-store')
    // Escape → features focused
    const focused = (container as HTMLElement).querySelector('[tabindex="0"][data-node-id]') as HTMLElement
    focused.focus()
    await user.keyboard('{Escape}')
    expect(getFocused(container as HTMLElement)).toBe('features')
  })

  // T6: Space selection toggle — verify aria-selected attribute
  it('T6: Space toggles selection (aria-selected)', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const stats = (container as HTMLElement).querySelector('[data-node-id="stats"]') as HTMLElement
    stats.focus()
    await user.keyboard(' ')
    expect(stats.getAttribute('aria-selected')).toBe('true')
    // Toggle off
    await user.keyboard(' ')
    expect(stats.getAttribute('aria-selected')).not.toBe('true')
  })

  // T9: no wrapping — Home on first item stays on first item
  it('T9: Home on first section stays on first section (no wrap)', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const hero = (container as HTMLElement).querySelector('[data-node-id="hero"]') as HTMLElement
    hero.focus()
    await user.keyboard('{Home}')
    expect(getFocused(container as HTMLElement)).toBe('hero')
  })

  it('T9: End on last section stays on last section (no wrap)', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const footer = (container as HTMLElement).querySelector('[data-node-id="footer"]') as HTMLElement
    footer.focus()
    await user.keyboard('{End}')
    expect(getFocused(container as HTMLElement)).toBe('footer')
  })

  // T12: Enter on leaf node has no children — no depth change
  it('T12: Enter on leaf node does not drill deeper', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    // Navigate into stats section
    const stats = (container as HTMLElement).querySelector('[data-node-id="stats"]') as HTMLElement
    stats.focus()
    await user.keyboard('{Enter}')
    // Should now be at stat-patterns (first child of stats)
    expect(getFocused(container as HTMLElement)).toBe('stat-patterns')
    // stat-patterns has no children — Enter should not change depth
    const statPatterns = (container as HTMLElement).querySelector('[tabindex="0"][data-node-id]') as HTMLElement
    statPatterns.focus()
    await user.keyboard('{Enter}')
    // Still at leaf level — either stays on stat-patterns or is a no-op
    const afterEnter = getFocused(container as HTMLElement)
    // Should remain at the same depth (stat-patterns or its sibling, not a child)
    const statsChildren = ['stat-patterns', 'stat-tests', 'stat-modules', 'stat-deps']
    expect(statsChildren).toContain(afterEnter)
  })

  // T13: Home/End inside a section
  it('T13: Home/End jump to first/last sibling inside a section', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    // Enter stats → inside stat children
    const stats = (container as HTMLElement).querySelector('[data-node-id="stats"]') as HTMLElement
    stats.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container as HTMLElement)).toBe('stat-patterns')
    // End → last stat child
    const firstStat = (container as HTMLElement).querySelector('[tabindex="0"][data-node-id]') as HTMLElement
    firstStat.focus()
    await user.keyboard('{End}')
    expect(getFocused(container as HTMLElement)).toBe('stat-deps')
    // Home → first stat child
    const lastStat = (container as HTMLElement).querySelector('[tabindex="0"][data-node-id]') as HTMLElement
    lastStat.focus()
    await user.keyboard('{Home}')
    expect(getFocused(container as HTMLElement)).toBe('stat-patterns')
  })

  // T8: Tab moves focus outside CMS widget
  it('T8: Tab moves focus outside CMS widget', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    const hero = (container as HTMLElement).querySelector('[data-node-id="hero"]') as HTMLElement
    hero.focus()

    await user.keyboard('{Tab}')

    // After Tab, focus should NOT be on any CMS node
    const activeNodeId = document.activeElement?.getAttribute('data-node-id')
    expect(activeNodeId).toBeNull()
  })
})

// ── PRD landing page examples (jsdom-compatible) ──

describe('PRD — landing page examples (jsdom-compatible)', () => {
  // E7: card depth — enter card, see icon/title/desc children
  it('E7: Enter card to navigate fields', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    // Enter features section → card-store focused
    const features = (container as HTMLElement).querySelector('[data-node-id="features"]') as HTMLElement
    features.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container as HTMLElement)).toBe('card-store')
    // Enter card-store → first child (card-store-icon) focused
    const cardStore = (container as HTMLElement).querySelector('[tabindex="0"][data-node-id]') as HTMLElement
    cardStore.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container as HTMLElement)).toBe('card-store-icon')
    // Escape → back to card-store
    const cardField = (container as HTMLElement).querySelector('[tabindex="0"][data-node-id]') as HTMLElement
    cardField.focus()
    await user.keyboard('{Escape}')
    expect(getFocused(container as HTMLElement)).toBe('card-store')
  })

  // Nested depth: section → card → field (3 levels)
  it('Three levels of depth navigation', async () => {
    const user = userEvent.setup()
    const { container } = render(<PageVisualCms />)
    // Level 1: root → features (Enter)
    const features = (container as HTMLElement).querySelector('[data-node-id="features"]') as HTMLElement
    features.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container as HTMLElement)).toBe('card-store')

    // Level 2: features → card-store (Enter)
    const cardStore = (container as HTMLElement).querySelector('[tabindex="0"][data-node-id]') as HTMLElement
    cardStore.focus()
    await user.keyboard('{Enter}')
    expect(getFocused(container as HTMLElement)).toBe('card-store-icon')

    // Escape from field → card-store
    const field = (container as HTMLElement).querySelector('[tabindex="0"][data-node-id]') as HTMLElement
    field.focus()
    await user.keyboard('{Escape}')
    expect(getFocused(container as HTMLElement)).toBe('card-store')

    // Escape from card → features
    const card = (container as HTMLElement).querySelector('[tabindex="0"][data-node-id]') as HTMLElement
    card.focus()
    await user.keyboard('{Escape}')
    expect(getFocused(container as HTMLElement)).toBe('features')
  })
})

// ── Arrow-direction tests need Playwright E2E ──

describe.todo('PRD — arrow direction tests (need Playwright E2E)', () => {
  // T1: horizontal ← → within row sections (stats, features, workflow, patterns)
  // T2: horizontal ← → ignores ↑↓ in pure-row sections
  // T3: grid 4-direction in patterns (grid layout)
  // T7: Shift+Arrow range selection
  // T10: incomplete grid row — last item, right arrow stays put
  // T11: resize recalculation — spatial nav recalculates on layout change
  // T14: click depth jump — click deep node focuses it directly
  // E1: hero section — vertical list (title, subtitle, cta)
  // E2: stats section — horizontal row (4 stats)
  // E3: features section — horizontal row (4 cards)
  // E4: workflow section — horizontal row (4 steps)
  // E5: patterns section — grid (14 patterns)
  // E6: footer section — vertical list (brand, links)
})

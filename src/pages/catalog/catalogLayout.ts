// ② flatlayout-nav-catalog-prd.md
// Builds FlatLayout NormalizedData from CatalogData
// TreeView nav (categories as folders, demos as leaves) + activeIndex-driven detail

import { defineLayout } from '@os/layout/defineLayout'
import type { LayoutNode } from '@os/layout/flatLayout'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { CatalogData } from './catalogLoader'

const CATEGORY_ORDER = ['ui', 'composite', 'panel', 'item', 'cell', 'indicator']

// Subcategory order per category (core intent first, peripheral last)
const SUBCATEGORY_ORDER: Record<string, string[]> = {
  ui: ['Input', 'Navigation', 'Collection', 'Overlay', 'Viewer', 'Feedback', 'Layout'],
  item: ['Generic', 'Editable', 'Specialized'],
  cell: ['Display', 'Editable', 'Semantic'],
  indicator: ['State', 'Progress', 'Affordance', 'Decoration'],
}

function sortSubGroups<T>(category: string, groups: Map<string, T>): Array<[string, T]> {
  const order = SUBCATEGORY_ORDER[category] ?? []
  return Array.from(groups).sort(([a], [b]) => {
    const ia = order.indexOf(a)
    const ib = order.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })
}

const CATEGORY_LABELS: Record<string, string> = {
  ui: 'Components',
  composite: 'Composites',
  panel: 'Panels',
  item: 'Items',
  cell: 'Cells',
  indicator: 'Indicators',
}

export function buildCatalogLayout(catalog: CatalogData) {
  const entities: Record<string, { data: LayoutNode; children?: string[] }> = {}

  const sortedCategories = Object.entries(catalog.categories).sort(([a], [b]) => {
    const ia = CATEGORY_ORDER.indexOf(a)
    const ib = CATEGORY_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  // ── Tree nav data (categories → demos) ──
  const navEntities: Record<string, { id: string; data: Record<string, unknown> }> = {}
  const navRelationships: Record<string, string[]> = { [ROOT_ID]: [] }

  for (const [category, entries] of sortedCategories) {
    const catId = `cat:${category}`
    navEntities[catId] = {
      id: catId,
      data: { label: `${CATEGORY_LABELS[category] ?? category} (${entries.length})` },
    }
    navRelationships[ROOT_ID].push(catId)

    // Group by subcategory if any entry has one
    const subGroups = new Map<string, typeof entries>()
    const ungrouped: typeof entries = []
    for (const entry of entries) {
      if (entry.subcategory) {
        const list = subGroups.get(entry.subcategory) ?? []
        list.push(entry)
        subGroups.set(entry.subcategory, list)
      } else {
        ungrouped.push(entry)
      }
    }

    for (const entry of entries) {
      const leafId = `leaf:${entry.slug}`
      navEntities[leafId] = { id: leafId, data: { label: entry.label } }
    }

    if (subGroups.size === 0) {
      navRelationships[catId] = entries.map((e) => `leaf:${e.slug}`)
    } else {
      const catChildren: string[] = []
      for (const [sub, subEntries] of sortSubGroups(category, subGroups)) {
        const subId = `sub:${category}:${sub}`
        navEntities[subId] = { id: subId, data: { label: `${sub} (${subEntries.length})` } }
        navRelationships[subId] = subEntries.map((e) => `leaf:${e.slug}`)
        catChildren.push(subId)
      }
      for (const entry of ungrouped) catChildren.push(`leaf:${entry.slug}`)
      navRelationships[catId] = catChildren
    }
  }

  const navStoreData = createStore({ entities: navEntities, relationships: navRelationships })

  // ── Content sections (activeIndex 0 = All) ──
  const contentIds: string[] = []
  const nodeIdToIndex: Record<string, number> = {}

  // Index 0: section:all — every category grid stacked
  const allSectionChildren: string[] = []
  for (const [category, entries] of sortedCategories) {
    const gridId = `grid:all:${category}`
    const sectionId = `section:all:${category}`
    const widgetIds = entries.map((entry) => {
      const widgetId = `demo:all:${entry.slug}`
      entities[widgetId] = { data: { type: 'widget', widget: entry.slug, props: {} } }
      return widgetId
    })
    entities[gridId] = { data: { type: 'grid', columns: 3, gap: 'md' }, children: widgetIds }
    entities[sectionId] = {
      data: { type: 'section', title: (CATEGORY_LABELS[category] ?? category).toUpperCase(), count: entries.length },
      children: [gridId],
    }
    allSectionChildren.push(sectionId)
  }
  entities['section:all'] = {
    data: { type: 'stack', gap: 'lg' },
    children: allSectionChildren,
  }
  contentIds.push('section:all')

  // Per-category grid (with optional subcategory sub-sections)
  for (const [category, entries] of sortedCategories) {
    const sectionId = `section:${category}`
    const subGroups = new Map<string, typeof entries>()
    const ungrouped: typeof entries = []
    for (const entry of entries) {
      if (entry.subcategory) {
        const list = subGroups.get(entry.subcategory) ?? []
        list.push(entry)
        subGroups.set(entry.subcategory, list)
      } else {
        ungrouped.push(entry)
      }
    }

    if (subGroups.size === 0) {
      const gridId = `grid:${category}`
      const widgetIds = entries.map((entry) => {
        const widgetId = `demo:cat:${entry.slug}`
        entities[widgetId] = { data: { type: 'widget', widget: entry.slug, props: {} } }
        return widgetId
      })
      entities[gridId] = { data: { type: 'grid', columns: 3, gap: 'md' }, children: widgetIds }
      entities[sectionId] = {
        data: { type: 'section', title: (CATEGORY_LABELS[category] ?? category).toUpperCase(), count: entries.length },
        children: [gridId],
      }
    } else {
      const subSectionIds: string[] = []
      const addSub = (title: string, subEntries: typeof entries, key: string) => {
        const gId = `grid:${category}:${key}`
        const sId = `section:${category}:${key}`
        const widgetIds = subEntries.map((entry) => {
          const widgetId = `demo:cat:${entry.slug}`
          entities[widgetId] = { data: { type: 'widget', widget: entry.slug, props: {} } }
          return widgetId
        })
        entities[gId] = { data: { type: 'grid', columns: 3, gap: 'md' }, children: widgetIds }
        entities[sId] = {
          data: { type: 'section', title, count: subEntries.length },
          children: [gId],
        }
        subSectionIds.push(sId)

        // Sub-section deep link
        nodeIdToIndex[`sub:${category}:${title}`] = contentIds.length
      }
      for (const [sub, subEntries] of sortSubGroups(category, subGroups)) addSub(sub, subEntries, sub)
      if (ungrouped.length > 0) addSub('Other', ungrouped, 'other')
      entities[sectionId] = { data: { type: 'stack', gap: 'lg' }, children: subSectionIds }
    }

    nodeIdToIndex[`cat:${category}`] = contentIds.length
    contentIds.push(sectionId)
  }

  // Per-demo single view
  for (const [, entries] of sortedCategories) {
    for (const entry of entries) {
      const singleId = `single:${entry.slug}`
      entities[singleId] = { data: { type: 'widget', widget: entry.slug, props: {} } }
      nodeIdToIndex[`leaf:${entry.slug}`] = contentIds.length
      contentIds.push(singleId)
    }
  }

  // Nav widget
  entities['nav'] = {
    data: {
      type: 'widget',
      widget: '__nav__',
      props: { navData: navStoreData, nodeIdToIndex },
    },
  }

  // Missing demos (appended to section:all)
  if (catalog.missing.length > 0) {
    const missingGridId = 'grid:missing'
    const missingSectionId = 'section:all:missing'
    const missingWidgetIds = catalog.missing.map((name) => {
      const id = `missing:${name}`
      entities[id] = { data: { type: 'widget', widget: '__empty__', props: { componentName: name } } }
      return id
    })
    entities[missingGridId] = { data: { type: 'grid', columns: 4, gap: 'sm' }, children: missingWidgetIds }
    entities[missingSectionId] = {
      data: { type: 'section', title: 'MISSING DEMOS', count: catalog.missing.length },
      children: [missingGridId],
    }
    entities['section:all'].children!.push(missingSectionId)
  }

  entities['root'] = {
    data: { type: 'nav', sidebarWidth: 0.18 },
    children: ['nav', ...contentIds],
  }

  return defineLayout({ entities })
}

// ② flatlayout-nav-catalog-prd.md
// Builds FlatLayout NormalizedData from CatalogData
// Nav layout with sidebar + category sections

import { definePage } from '@os/layout/flatLayout'
import type { LayoutNode } from '@os/layout/flatLayout'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { CatalogData } from './catalogLoader'

const CATEGORY_ORDER = ['ui', 'composite', 'panel', 'item', 'cell', 'indicator']

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

  // Sort categories by defined order
  const sortedCategories = Object.entries(catalog.categories).sort(([a], [b]) => {
    const ia = CATEGORY_ORDER.indexOf(a)
    const ib = CATEGORY_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  // Nav widget — pre-built NormalizedData for NavList
  const navStoreData = createStore({
    entities: Object.fromEntries(
      sortedCategories.map(([cat, entries]) => [
        cat,
        { id: cat, data: { label: `${CATEGORY_LABELS[cat] ?? cat} (${entries.length})` } },
      ]),
    ),
    relationships: { [ROOT_ID]: sortedCategories.map(([cat]) => cat) },
  })

  entities['nav'] = {
    data: {
      type: 'widget',
      widget: '__nav__',
      props: {
        navData: navStoreData,
        categoryIds: sortedCategories.map(([cat]) => cat),
      },
    },
  }

  // Each category section
  const sectionIds: string[] = []
  for (const [category, entries] of sortedCategories) {
    const sectionId = `section:${category}`
    sectionIds.push(sectionId)

    const gridId = `grid:${category}`
    const widgetIds = entries.map(entry => {
      const widgetId = `demo:${entry.slug}`
      entities[widgetId] = {
        data: { type: 'widget', widget: entry.slug, props: {} },
      }
      return widgetId
    })

    entities[gridId] = {
      data: { type: 'grid', columns: 3, gap: 'md' },
      children: widgetIds,
    }

    entities[sectionId] = {
      data: { type: 'section', title: (CATEGORY_LABELS[category] ?? category).toUpperCase(), count: entries.length },
      children: [gridId],
    }
  }

  // Missing components section
  if (catalog.missing.length > 0) {
    const sectionId = 'section:missing'
    sectionIds.push(sectionId)

    const gridId = 'grid:missing'
    const missingWidgetIds = catalog.missing.map(name => {
      const id = `missing:${name}`
      entities[id] = {
        data: { type: 'widget', widget: '__empty__', props: { componentName: name } },
      }
      return id
    })

    entities[gridId] = {
      data: { type: 'grid', columns: 4, gap: 'sm' },
      children: missingWidgetIds,
    }

    entities[sectionId] = {
      data: { type: 'section', title: 'MISSING DEMOS', count: catalog.missing.length },
      children: [gridId],
    }
  }

  // Root: NavNode
  entities['root'] = {
    data: { type: 'nav', sidebarWidth: 0.18 },
    children: ['nav', ...sectionIds],
  }

  return definePage({ entities })
}

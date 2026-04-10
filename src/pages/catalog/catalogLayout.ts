// ── Catalog Layout ──
// Builds FlatLayout NormalizedData from CatalogData
// Grid layout with category section headers + surface cards

import { definePage } from '@os/layout/flatLayout'
import type { LayoutNode } from '@os/layout/flatLayout'
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
  const categoryIds: string[] = []

  // Sort categories by defined order
  const sortedCategories = Object.entries(catalog.categories).sort(([a], [b]) => {
    const ia = CATEGORY_ORDER.indexOf(a)
    const ib = CATEGORY_ORDER.indexOf(b)
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib)
  })

  for (const [category, entries] of sortedCategories) {
    const sectionId = `section:${category}`
    categoryIds.push(sectionId)

    // Header widget
    const headerId = `header:${category}`
    entities[headerId] = {
      data: { type: 'widget', widget: '__header__', props: { label: CATEGORY_LABELS[category] ?? category, count: entries.length } },
    }

    // Grid of demo cards
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

    // Section = header + grid
    entities[sectionId] = {
      data: { type: 'stack', gap: 'md' },
      children: [headerId, gridId],
    }
  }

  // Missing components section
  if (catalog.missing.length > 0) {
    const sectionId = 'section:missing'
    categoryIds.push(sectionId)

    const headerId = 'header:missing'
    entities[headerId] = {
      data: { type: 'widget', widget: '__header__', props: { label: 'Missing Demos', count: catalog.missing.length } },
    }

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
      data: { type: 'stack', gap: 'md' },
      children: [headerId, gridId],
    }
  }

  // Root
  entities['root'] = {
    data: { type: 'stack', gap: 'lg' },
    children: categoryIds,
  }

  return definePage({ entities })
}

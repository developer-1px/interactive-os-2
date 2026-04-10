// ── Catalog Layout ──
// Builds FlatLayout NormalizedData from CatalogData

import type { NormalizedData } from '@os/store/types'
import { definePage } from '@os/layout/flatLayout'
import type { LayoutNode } from '@os/layout/flatLayout'
import type { CatalogData } from './catalogLoader'

export function buildCatalogLayout(catalog: CatalogData): NormalizedData {
  const entities: Record<string, { data: LayoutNode; children?: string[] }> = {}

  const categoryIds: string[] = []

  // Build category sections
  for (const [category, entries] of Object.entries(catalog.categories)) {
    const categoryId = `cat:${category}`
    categoryIds.push(categoryId)

    const widgetIds = entries.map(entry => {
      const widgetId = `demo:${entry.slug}`
      entities[widgetId] = {
        data: { type: 'widget', widget: entry.slug, props: {} },
      }
      return widgetId
    })

    entities[categoryId] = {
      data: { type: 'stack', gap: 'md' },
      children: widgetIds,
    }
  }

  // Missing components section
  if (catalog.missing.length > 0) {
    const missingId = 'cat:missing'
    categoryIds.push(missingId)

    const missingWidgetIds = catalog.missing.map(name => {
      const id = `missing:${name}`
      entities[id] = {
        data: { type: 'widget', widget: '__empty__', props: { componentName: name } },
      }
      return id
    })

    entities[missingId] = {
      data: { type: 'stack', gap: 'md' },
      children: missingWidgetIds,
    }
  }

  // Root stack
  entities['root'] = {
    data: { type: 'stack', gap: 'lg' },
    children: categoryIds,
  }

  return definePage({ entities })
}

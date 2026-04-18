var e=`/* eslint-disable react-refresh/only-export-components */
import type React from 'react'
import { ax } from '@styles/ax'

/* ══ Eager-load ALL demo modules — no lazy, no loading state ══ */

interface DemoModule {
  meta?: { label?: string }
  Demo: () => React.ReactNode
}

const demoModules = import.meta.glob<DemoModule>(
  '/src/interactive-os/ui/**/*.demo.tsx',
  { eager: true },
)

/* ══ Derive category from folder path, not meta ══ */

interface DemoEntry {
  path: string
  label: string
  slug: string
  Demo: () => React.ReactNode
}

const categoryOrder = ['ui', 'composites', 'indicators', 'items', 'cells', 'panels'] as const

const folderToCategory: Record<string, string> = {
  composites: 'composites',
  indicators: 'indicators',
  items: 'items',
  cells: 'cells',
  panels: 'panels',
}

function categoryFromPath(path: string): string {
  // /src/interactive-os/ui/items/TabItem.demo.tsx → 'items'
  // /src/interactive-os/ui/Button.demo.tsx → 'ui'
  const after = path.replace('/src/interactive-os/ui/', '')
  const folder = after.split('/')[0]
  return folderToCategory[folder] ?? 'ui'
}

function labelFromPath(path: string): string {
  const filename = path.split('/').pop() ?? ''
  return filename.replace('.demo.tsx', '')
}

function slugFromPath(path: string): string {
  return labelFromPath(path).replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase()
}

function buildEntries(): { categories: Record<string, DemoEntry[]>; sortedCategoryNames: string[] } {
  const categories: Record<string, DemoEntry[]> = {}

  for (const [path, mod] of Object.entries(demoModules)) {
    if (!mod.Demo) continue
    const cat = categoryFromPath(path)
    if (!categories[cat]) categories[cat] = []
    categories[cat].push({ path, label: mod.meta?.label ?? labelFromPath(path), slug: slugFromPath(path), Demo: mod.Demo })
  }

  // Sort entries within each category by label
  for (const entries of Object.values(categories)) {
    entries.sort((a, b) => a.label.localeCompare(b.label))
  }

  // Sort categories by predefined order
  const sortedCategoryNames = Object.keys(categories).sort((a, b) => {
    const ai = categoryOrder.indexOf(a as typeof categoryOrder[number])
    const bi = categoryOrder.indexOf(b as typeof categoryOrder[number])
    return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi)
  })

  return { categories, sortedCategoryNames }
}

const { categories, sortedCategoryNames } = buildEntries()
const totalCount = Object.values(categories).reduce((sum, entries) => sum + entries.length, 0)

/* ══ Components ══ */

export function ThemeComponents() {
  return (
    <div className={ax({ layout: 'stack', gap: 'lg' })}>
      <div className={ax({ layout: 'bar', gap: 'sm' })}>
        <span className={ax({ textStyle: 'caption', text: 'muted' })}>{totalCount} components</span>
      </div>

      {sortedCategoryNames.map(catName => (
        <div key={catName} className={ax({ layout: 'stack', gap: 'md' })}>
          {/* Category header */}
          <div className={ax({ layout: 'bar', gap: 'sm', border: 'bottom', padding: 'xs' })}>
            <h2 className={ax({ textStyle: 'overline', text: 'muted' })}>{catName}</h2>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>({categories[catName].length})</span>
          </div>

          {/* Demo grid */}
          <div className="theme-masonry-grid" style={{ gap: 'var(--space-md)' }}>
            {categories[catName].map(entry => (
              <div
                key={entry.slug}
                className={ax({ surface: 'display', layout: 'stack', gap: 'sm', padding: 'md', shape: 'lg', scroll: 'hidden' })}
              >
                <span className={ax({ textStyle: 'label', text: 'secondary' })}>{entry.label}</span>
                <entry.Demo />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
`;export{e as default};
// ── Catalog Loader ──
// Auto-collects *.demo.tsx files from ui/ via import.meta.glob

import type React from 'react'

export interface DemoMeta {
  slug: string
  category: string
  label: string
}

export interface DemoModule {
  meta: DemoMeta
  Demo: () => React.ReactNode
}

export interface CatalogEntry {
  slug: string
  label: string
  category: string
  load: () => Promise<DemoModule>
}

export interface CatalogData {
  categories: Record<string, CatalogEntry[]>
  missing: string[]
}

// Lazy demo modules
const demoModules = import.meta.glob<DemoModule>(
  '/src/interactive-os/ui/**/*.demo.tsx',
  { eager: false },
)

// All ui component files (keys only)
const uiComponents = import.meta.glob(
  '/src/interactive-os/ui/*.tsx',
  { eager: false },
)

function extractComponentName(path: string): string {
  return path.split('/').pop()?.replace('.tsx', '') ?? ''
}

function extractDemoSlug(path: string): string {
  const filename = path.split('/').pop() ?? ''
  return filename.replace('.demo.tsx', '')
}

export async function loadCatalog(): Promise<CatalogData> {
  const categories: Record<string, CatalogEntry[]> = {}
  const demoSlugs = new Set<string>()

  // Build entries from demo modules
  for (const [path, loader] of Object.entries(demoModules)) {
    const slug = extractDemoSlug(path)
    demoSlugs.add(slug)

    // Peek at meta by loading the module
    const mod = await loader()
    const { meta } = mod
    const category = meta.category ?? 'Uncategorized'

    if (!categories[category]) {
      categories[category] = []
    }

    categories[category].push({
      slug: meta.slug ?? slug,
      label: meta.label ?? slug,
      category,
      load: loader,
    })
  }

  // Find components without demos
  const allComponentNames = Object.keys(uiComponents)
    .map(extractComponentName)
    .filter(name => name && !name.startsWith('_') && !name.includes('.demo') && !name.includes('.module'))

  const missing = allComponentNames.filter(name => {
    const slug = name
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .toLowerCase()
    return !demoSlugs.has(slug) && !demoSlugs.has(name)
  })

  return { categories, missing }
}

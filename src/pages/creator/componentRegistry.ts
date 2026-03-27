// ② 2026-03-27-component-creator-prd.md

/**
 * Auto-discover UI components from ui/ directory.
 * Uses Vite's import.meta.glob to find all TSX files (primary).
 * If a matching module.css exists, parses it for ComponentMeta.
 * Components without CSS get an empty meta (no variants/sizes).
 */

import { parseComponentCSS, type ComponentMeta } from './parseComponentCSS'

// Glob all tsx component modules (lazy for tree-shaking)
const tsxModules = import.meta.glob<{ [key: string]: React.ComponentType<Record<string, unknown>> }>(
  '../../interactive-os/ui/*.tsx',
)

// Glob all module.css files as raw strings (eager for instant access)
const cssModules = import.meta.glob<string>(
  '../../interactive-os/ui/*.module.css',
  { query: '?raw', import: 'default', eager: true },
)

/** Extract component name from file path: .../Button.tsx → "Button" */
function nameFromPath(path: string): string {
  const filename = path.split('/').pop() ?? ''
  return filename.replace(/\.(module\.css|tsx)$/, '')
}

export interface RegistryEntry extends ComponentMeta {
  cssPath: string | null
  tsxPath: string
  loadComponent: () => Promise<React.ComponentType<Record<string, unknown>>>
}

// Skip hook/utility files that aren't renderable components
const SKIP_PREFIXES = ['use', 'create']

/** Build registry from TSX glob (primary), enrich with CSS when available */
function buildRegistry(): RegistryEntry[] {
  const entries: RegistryEntry[] = []

  for (const [tsxPath, loader] of Object.entries(tsxModules)) {
    const name = nameFromPath(tsxPath)

    // Skip hooks and factory functions
    if (SKIP_PREFIXES.some((p) => name.startsWith(p))) continue

    const cssPath = tsxPath.replace('.tsx', '.module.css')
    const rawCSS = cssModules[cssPath] ?? null

    const meta: ComponentMeta = rawCSS
      ? parseComponentCSS(rawCSS, name)
      : { name, base: 'root', variants: [], sizes: [], tokens: { shape: null, type: null, motion: null } }

    entries.push({
      ...meta,
      cssPath: rawCSS ? cssPath : null,
      tsxPath,
      loadComponent: async () => {
        const mod = await loader()
        // Return the named export matching the component name, or first export
        return (mod[name] ?? Object.values(mod)[0]) as React.ComponentType<Record<string, unknown>>
      },
    })
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name))
}

export const componentRegistry: RegistryEntry[] = buildRegistry()

/** Find a registry entry by name */
export function findComponent(name: string): RegistryEntry | undefined {
  return componentRegistry.find((e) => e.name === name)
}

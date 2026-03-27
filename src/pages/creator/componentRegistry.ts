// ② 2026-03-27-component-creator-prd.md

/**
 * Auto-discover UI components from ui/ directory.
 * Uses Vite's import.meta.glob to find all module.css + tsx pairs.
 * Parses module.css with parseComponentCSS to extract ComponentMeta.
 */

import { parseComponentCSS, type ComponentMeta } from './parseComponentCSS'

// Glob all module.css files as raw strings (eager for instant access)
const cssModules = import.meta.glob<string>(
  '../../interactive-os/ui/*.module.css',
  { query: '?raw', import: 'default', eager: true },
)

// Glob all tsx component modules (lazy for tree-shaking)
const tsxModules = import.meta.glob<{ [key: string]: React.ComponentType<Record<string, unknown>> }>(
  '../../interactive-os/ui/*.tsx',
)

/** Extract component name from file path: .../Button.module.css → "Button" */
function nameFromPath(path: string): string {
  const filename = path.split('/').pop() ?? ''
  return filename.replace(/\.(module\.css|tsx)$/, '')
}

export interface RegistryEntry extends ComponentMeta {
  cssPath: string
  tsxPath: string
  loadComponent: () => Promise<React.ComponentType<Record<string, unknown>>>
}

/** Build registry from glob results */
function buildRegistry(): RegistryEntry[] {
  const entries: RegistryEntry[] = []

  for (const [cssPath, rawCSS] of Object.entries(cssModules)) {
    const name = nameFromPath(cssPath)
    const tsxPath = cssPath.replace('.module.css', '.tsx')

    // Skip if no matching TSX file
    if (!tsxModules[tsxPath]) continue

    const meta = parseComponentCSS(rawCSS, name)

    entries.push({
      ...meta,
      cssPath,
      tsxPath,
      loadComponent: async () => {
        const mod = await tsxModules[tsxPath]()
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

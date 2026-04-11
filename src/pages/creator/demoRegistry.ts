/**
 * Demo-centric registry: auto-discover *.demo.tsx from ui/ directory.
 * Each demo exports { meta: { slug, label }, Demo: ComponentType }.
 */

interface DemoMeta {
  slug: string
  category?: string
  label: string
}

export interface DemoEntry {
  name: string
  label: string
  path: string
  loadDemo: () => Promise<{ Demo: React.ComponentType; meta?: DemoMeta }>
}

// Glob all demo modules (lazy)
const demoModules = import.meta.glob<{ Demo: React.ComponentType; meta?: DemoMeta }>(
  '../../interactive-os/ui/*.demo.tsx',
)

// Glob raw source for demo files (eager for instant code view)
export const demoSources: Record<string, string> = Object.fromEntries(
  Object.entries(
    import.meta.glob<string>(
      '../../interactive-os/ui/*.demo.tsx',
      { query: '?raw', import: 'default', eager: true },
    ),
  ).map(([path, src]) => {
    const filename = path.split('/').pop()!
    const name = filename.replace('.demo.tsx', '')
    return [name, src]
  }),
)

function nameFromPath(path: string): string {
  const filename = path.split('/').pop() ?? ''
  return filename.replace('.demo.tsx', '')
}

function buildRegistry(): DemoEntry[] {
  const entries: DemoEntry[] = []

  for (const [path, loader] of Object.entries(demoModules)) {
    const name = nameFromPath(path)
    entries.push({
      name,
      label: name,
      path,
      loadDemo: loader,
    })
  }

  return entries.sort((a, b) => a.name.localeCompare(b.name))
}

export const demoRegistry: DemoEntry[] = buildRegistry()

export function findDemo(name: string): DemoEntry | undefined {
  return demoRegistry.find((e) => e.name === name)
}

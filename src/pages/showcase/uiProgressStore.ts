// ── UI Component Progress Store ──
// Scans ui/ components via import.meta.glob and checks 5 completion stages:
// recipe | demo | test | doc | score

import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type { ColumnDef } from '@os/ui/PipelineGrid'

// ── Types ──

type StageKey = 'recipe' | 'demo' | 'test' | 'doc'
type StageStatus = 'done' | 'missing'

interface ComponentNode extends Record<string, unknown> {
  label: string
  tier: 'layer' | 'component'
  subtitle?: string
  catalog?: string
  stages: Record<StageKey, { status: StageStatus }>
}

// ── Build-time file discovery ──

const uiSources = import.meta.glob(
  '/src/interactive-os/ui/*.tsx',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const uiItemSources = import.meta.glob(
  '/src/interactive-os/ui/items/*.tsx',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const uiCellSources = import.meta.glob(
  '/src/interactive-os/ui/cells/*.tsx',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const uiPanelSources = import.meta.glob(
  '/src/interactive-os/ui/panels/*.tsx',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const uiCompositeSources = import.meta.glob(
  '/src/interactive-os/ui/composites/*.tsx',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

const uiIndicatorSources = import.meta.glob(
  '/src/interactive-os/ui/indicators/*.tsx',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

// Existence checks (keys only, not content)
const testFiles = import.meta.glob(
  '/src/interactive-os/__tests__/*.test.tsx',
  { eager: true, query: '?url' },
) as Record<string, unknown>

const docFiles = import.meta.glob(
  '/contents/ui/*.md',
  { eager: true, query: '?url' },
) as Record<string, unknown>

// Demo slugs from showcaseRegistry (import the slug list)
const registrySlugs = import.meta.glob(
  '/src/pages/showcase/showcaseRegistry.tsx',
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>

// ── Helpers ──

function extractCatalog(source: string): string | undefined {
  const match = source.match(/@catalog\s+(.+?)\s*\*\//)
  return match?.[1]
}

function hasRecipe(source: string): boolean {
  return /recipe\s*[:=]/.test(source)
}

function componentNameToSlug(name: string): string {
  // PascalCase → kebab-case: NavList → navlist, TreeGrid → tree-grid
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .toLowerCase()
}

function getRegistrySlugs(): Set<string> {
  const raw = Object.values(registrySlugs)[0] ?? ''
  const slugs = new Set<string>()
  for (const match of raw.matchAll(/slug:\s*'([^']+)'/g)) {
    slugs.add(match[1])
  }
  return slugs
}

function hasTest(componentName: string): boolean {
  const slug = componentNameToSlug(componentName)
  // Check various test naming patterns
  for (const key of Object.keys(testFiles)) {
    const filename = key.split('/').pop()?.toLowerCase() ?? ''
    if (
      filename.startsWith(`${slug}-`) ||
      filename.startsWith(`${slug}.`) ||
      filename.includes(slug)
    ) {
      return true
    }
  }
  return false
}

function hasDoc(componentName: string): boolean {
  const key = `/contents/ui/${componentName}.md`
  return key in docFiles
}

// ── Layer definitions ──

interface LayerDef {
  id: string
  label: string
  sources: Record<string, string>
}

const LAYERS: LayerDef[] = [
  { id: 'ui', label: 'Core', sources: uiSources },
  { id: 'items', label: 'Items', sources: uiItemSources },
  { id: 'cells', label: 'Cells', sources: uiCellSources },
  { id: 'panels', label: 'Panels', sources: uiPanelSources },
  { id: 'composites', label: 'Composites', sources: uiCompositeSources },
  { id: 'indicators', label: 'Indicators', sources: uiIndicatorSources },
]

// ── Columns ──

export const PROGRESS_COLUMNS: ColumnDef[] = [
  { key: 'feature', header: 'Component', width: '1fr' },
  { key: 'recipe', header: 'Recipe', width: '72px' },
  { key: 'demo', header: 'Demo', width: '72px' },
  { key: 'test', header: 'Test', width: '72px' },
  { key: 'doc', header: 'Doc', width: '72px' },
]

// ── Build store ──

export function buildProgressStore(): NormalizedData {
  const demoSlugs = getRegistrySlugs()

  const entities: Record<string, { id: string; data: ComponentNode }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  for (const layer of LAYERS) {
    const layerId = `layer:${layer.id}`
    relationships[ROOT_ID].push(layerId)
    const childIds: string[] = []

    const componentNames = Object.keys(layer.sources)
      .map(path => path.split('/').pop()?.replace('.tsx', '') ?? '')
      .filter(name => name && !name.startsWith('_'))
      .sort()

    for (const name of componentNames) {
      const source = Object.entries(layer.sources)
        .find(([p]) => p.endsWith(`/${name}.tsx`))?.[1] ?? ''

      const slug = componentNameToSlug(name)
      const catalog = extractCatalog(source)
      const nodeId = `${layer.id}:${name}`

      const stages: Record<StageKey, { status: StageStatus }> = {
        recipe: { status: hasRecipe(source) ? 'done' : 'missing' },
        demo: { status: demoSlugs.has(slug) ? 'done' : 'missing' },
        test: { status: hasTest(name) ? 'done' : 'missing' },
        doc: { status: hasDoc(name) ? 'done' : 'missing' },
      }

      const cells = [
        { text: name, tier: 'component', subtitle: catalog },
        stages.recipe,
        stages.demo,
        stages.test,
        stages.doc,
      ]

      entities[nodeId] = {
        id: nodeId,
        data: { label: name, tier: 'component', subtitle: catalog, catalog, stages, cells },
      }
      childIds.push(nodeId)
    }

    // Aggregate layer status
    const layerStages: Record<StageKey, { status: StageStatus }> = {
      recipe: { status: 'missing' },
      demo: { status: 'missing' },
      test: { status: 'missing' },
      doc: { status: 'missing' },
    }

    for (const key of ['recipe', 'demo', 'test', 'doc'] as StageKey[]) {
      const doneCount = childIds.filter(cid => entities[cid].data.stages[key].status === 'done').length
      if (doneCount === childIds.length && childIds.length > 0) {
        layerStages[key] = { status: 'done' }
      }
    }

    const doneTotal = childIds.reduce((sum, cid) => {
      const s = entities[cid].data.stages
      return sum + (['recipe', 'demo', 'test', 'doc'] as StageKey[]).filter(k => s[k].status === 'done').length
    }, 0)
    const total = childIds.length * 4

    const cells = [
      { text: layer.label, tier: 'layer', subtitle: `${doneTotal}/${total}` },
      layerStages.recipe,
      layerStages.demo,
      layerStages.test,
      layerStages.doc,
    ]

    entities[layerId] = {
      id: layerId,
      data: { label: layer.label, tier: 'layer', subtitle: `${doneTotal}/${total}`, stages: layerStages, cells },
    }
    relationships[layerId] = childIds
  }

  return createStore({ entities, relationships })
}

// ── Singleton ──

export const progressStore = buildProgressStore()

// ── Stats ──

export function getProgressStats(store: NormalizedData): { done: number; total: number; byStage: Record<StageKey, { done: number; total: number }> } {
  const componentIds = Object.keys(store.entities).filter(id => id.includes(':') && !id.startsWith('layer:') && id !== ROOT_ID && id !== '__focus__' && id !== '__grid_col__')

  const byStage: Record<StageKey, { done: number; total: number }> = {
    recipe: { done: 0, total: 0 },
    demo: { done: 0, total: 0 },
    test: { done: 0, total: 0 },
    doc: { done: 0, total: 0 },
  }

  for (const id of componentIds) {
    const data = store.entities[id]?.data as ComponentNode | undefined
    if (!data?.stages) continue
    for (const key of ['recipe', 'demo', 'test', 'doc'] as StageKey[]) {
      byStage[key].total++
      if (data.stages[key].status === 'done') byStage[key].done++
    }
  }

  const done = Object.values(byStage).reduce((s, v) => s + v.done, 0)
  const total = Object.values(byStage).reduce((s, v) => s + v.total, 0)

  return { done, total, byStage }
}

import yamlLib from 'yaml'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type { ColumnDef } from '@os/ui/PipelineGrid'

// ── Preview content type ──

export type PreviewContent =
  | { type: 'image'; src: string; caption?: string }
  | { type: 'markdown'; path: string; fallback: string }
  | { type: 'summary'; title: string; body: string }
  | { type: 'fileList'; title: string; files: { label: string; path: string }[] }
  | { type: 'empty'; message: string }

// ── Pipeline YAML types ──

type Tier = 'need' | 'story' | 'feature'
type Scope = Tier | 'project'

interface StageDef {
  key: string
  label: string
  artifact: string
  scope: Scope[]
}

interface FeatureDef {
  id: string
  title: string
  what?: string
  how?: string
  detail?: string[]
}

interface StoryDef {
  id: string
  title: string
  what?: string
  how?: string
  features?: FeatureDef[]
}

interface NeedDef {
  id: string
  title: string
  what?: string
  stories?: StoryDef[]
}

interface PipelineYaml {
  project: string
  base: string
  stages: StageDef[]
  needs: NeedDef[]
}

// ── Cell types ──

interface StageStatus {
  status: 'done' | 'propagated' | 'partial' | 'missing' | null
  artifactPath?: string
}

interface PipelineNode extends Record<string, unknown> {
  label: string
  tier: Tier
  subtitle?: string
  thumbnail?: string
  stages: Record<string, StageStatus>
  previews: Record<string, PreviewContent>
}

// ── Build-time file discovery ──

const pipelineYamls = import.meta.glob('/docs/1-projects/*/pipeline.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const metaFiles = import.meta.glob('/docs/1-projects/**/**/meta.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const mdArtifacts = import.meta.glob('/docs/1-projects/**/*.md', { query: '?raw', import: 'default', eager: false }) as Record<string, () => Promise<string>>
const yamlArtifactFiles = import.meta.glob('/docs/1-projects/**/sources.yaml', { query: '?raw', import: 'default', eager: true }) as Record<string, string>
const imageFiles = import.meta.glob('/docs/1-projects/**/*.{png,jpg,jpeg,gif,webp}', { query: '?url', import: 'default', eager: true }) as Record<string, string>

// ── Parsed sources cache ──

const parsedSources = new Map<string, string[]>()
function getSourcesList(yamlKey: string): string[] {
  if (parsedSources.has(yamlKey)) return parsedSources.get(yamlKey)!
  const raw = yamlArtifactFiles[yamlKey]
  if (!raw) return []
  const list = yamlLib.parse(raw) as string[]
  parsedSources.set(yamlKey, list)
  return list
}

// ── All projects with pipeline.yaml ──

export const ALL_PROJECTS = Object.keys(pipelineYamls)
  .map(p => p.split('/').at(-2) ?? '')
  .sort()

// ── Helpers ──

function findThumbnail(basePath: string, segments: string[]): string | null {
  const prefix = `/${basePath}/${segments.join('/')}/`
  for (const path of Object.keys(imageFiles)) {
    if (path.startsWith(prefix)) return imageFiles[path]
  }
  return null
}

function artifactExists(basePath: string, nodePathSegments: string[], artifactName: string): string | null {
  // Build full path: /docs/1-projects/{project}/{...segments}/{artifact}
  const fullPath = `/${basePath}/${nodePathSegments.join('/')}/${artifactName}`
  // Check md artifacts
  if (fullPath in mdArtifacts) return fullPath.slice(1)
  // Check yaml artifacts
  if (fullPath in yamlArtifactFiles) return fullPath.slice(1)
  // Check meta files (for non-standard artifacts)
  if (`/${basePath}/${nodePathSegments.join('/')}/${artifactName}` in metaFiles) return fullPath.slice(1)
  return null
}

function findAncestorArtifact(basePath: string, segments: string[], artifactName: string): string | null {
  // Walk up from parent to root
  for (let i = segments.length - 1; i >= 1; i--) {
    const ancestorSegments = segments.slice(0, i)
    const found = artifactExists(basePath, ancestorSegments, artifactName)
    if (found) return found
  }
  return null
}

function projectRootArtifact(basePath: string, artifactName: string): string | null {
  const fullPath = `/${basePath}/${artifactName}`
  if (fullPath in mdArtifacts) return fullPath.slice(1)
  if (fullPath in yamlArtifactFiles) return fullPath.slice(1)
  return null
}

// ── Build store from pipeline.yaml ──

function buildFromPipeline(projectId: string): { store: NormalizedData; columns: ColumnDef[]; projectName: string } {
  const yamlKey = `/docs/1-projects/${projectId}/pipeline.yaml`
  const raw = pipelineYamls[yamlKey]
  if (!raw) {
    return {
      store: createStore({ entities: {}, relationships: { [ROOT_ID]: [] } }),
      columns: [{ key: 'feature', header: 'Feature', width: '1fr' }],
      projectName: projectId,
    }
  }

  const pipeline = yamlLib.parse(raw) as PipelineYaml
  const stages = pipeline.stages
  const basePath = pipeline.base

  // Build columns
  const featureCol: ColumnDef = { key: 'feature', header: 'Feature', width: '1fr' }
  const stageCols: ColumnDef[] = stages.map(s => ({ key: s.key, header: s.label, width: '80px' }))
  const columns = [featureCol, ...stageCols]

  // Collect all nodes and relationships
  const entities: Record<string, { id: string; data: PipelineNode }> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  // Track children status for partial aggregation (bottom-up pass later)
  const nodeChildren: Record<string, string[]> = {}
  const nodePaths: Record<string, string[]> = {}  // id → path segments
  const nodeTiers: Record<string, 'need' | 'story' | 'feature'> = {}
  const nodeMeta: Record<string, { title: string; what?: string; how?: string; detail?: string[] }> = {}

  // Flatten the tree
  for (const need of pipeline.needs) {
    const needId = need.id
    relationships[ROOT_ID].push(needId)
    nodePaths[needId] = [needId]
    nodeTiers[needId] = 'need'
    nodeMeta[needId] = { title: need.title, what: need.what }
    nodeChildren[needId] = []

    if (need.stories) {
      for (const story of need.stories) {
        const storyId = story.id
        nodeChildren[needId].push(storyId)
        nodePaths[storyId] = [needId, storyId]
        nodeTiers[storyId] = 'story'
        nodeMeta[storyId] = { title: story.title, what: story.what, how: story.how }
        nodeChildren[storyId] = []

        if (story.features) {
          for (const feature of story.features) {
            const featureId = feature.id
            nodeChildren[storyId].push(featureId)
            nodePaths[featureId] = [needId, storyId, featureId]
            nodeTiers[featureId] = 'feature'
            nodeMeta[featureId] = { title: feature.title, what: feature.what, how: feature.how, detail: feature.detail }
            nodeChildren[featureId] = []
          }
        }
      }
    }
  }

  // Set up relationships
  for (const [parentId, childIds] of Object.entries(nodeChildren)) {
    if (childIds.length > 0) {
      relationships[parentId] = childIds
    }
  }

  // Compute stage statuses (leaf first, then aggregate)
  const nodeStages: Record<string, Record<string, StageStatus>> = {}

  // First pass: compute leaf statuses
  const allNodeIds = Object.keys(nodeTiers)
  for (const nodeId of allNodeIds) {
    const tier = nodeTiers[nodeId]
    const segments = nodePaths[nodeId]
    const stageMap: Record<string, StageStatus> = {}

    for (const stage of stages) {
      if (stage.scope.includes('project')) {
        // Project-level artifact
        const rootPath = projectRootArtifact(basePath, stage.artifact)
        if (rootPath) {
          stageMap[stage.key] = { status: 'propagated', artifactPath: rootPath }
        } else {
          stageMap[stage.key] = { status: 'missing' }
        }
        continue
      }

      if (!stage.scope.includes(tier)) {
        stageMap[stage.key] = { status: null }
        continue
      }

      // Check own folder
      const ownPath = artifactExists(basePath, segments, stage.artifact)
      if (ownPath) {
        stageMap[stage.key] = { status: 'done', artifactPath: ownPath }
        continue
      }

      // Check ancestor folders
      const ancestorPath = findAncestorArtifact(basePath, segments, stage.artifact)
      if (ancestorPath) {
        stageMap[stage.key] = { status: 'propagated', artifactPath: ancestorPath }
        continue
      }

      stageMap[stage.key] = { status: 'missing' }
    }

    nodeStages[nodeId] = stageMap
  }

  // Second pass: aggregate children status for parent nodes (memoized)
  const aggCache = new Map<string, 'done' | 'partial' | 'missing' | null>()

  function aggregateChildren(parentId: string, stageKey: string): 'done' | 'partial' | 'missing' | null {
    const cacheKey = `${parentId}:${stageKey}`
    if (aggCache.has(cacheKey)) return aggCache.get(cacheKey)!

    const children = nodeChildren[parentId]
    if (children.length === 0) { aggCache.set(cacheKey, null); return null }

    const childStatuses: (string | null)[] = []
    for (const childId of children) {
      const childStage = nodeStages[childId]?.[stageKey]
      if (!childStage || childStage.status === null) continue
      const grandChildren = nodeChildren[childId]
      if (grandChildren.length > 0) {
        const agg = aggregateChildren(childId, stageKey)
        if (agg !== null) childStatuses.push(agg)
      } else {
        childStatuses.push(childStage.status === 'propagated' ? 'done' : childStage.status)
      }
    }

    let result: 'done' | 'partial' | 'missing' | null = null
    if (childStatuses.length > 0) {
      if (childStatuses.every(s => s === 'done')) result = 'done'
      else if (childStatuses.every(s => s === 'missing')) result = 'missing'
      else result = 'partial'
    }
    aggCache.set(cacheKey, result)
    return result
  }

  // Apply aggregation to parent nodes where own status is missing
  for (const nodeId of allNodeIds) {
    const children = nodeChildren[nodeId]
    if (children.length === 0) continue

    for (const stage of stages) {
      const current = nodeStages[nodeId][stage.key]
      if (!current || current.status === null) continue
      if (current.status === 'done' || current.status === 'propagated') continue

      const agg = aggregateChildren(nodeId, stage.key)
      if (agg && agg !== 'missing') {
        nodeStages[nodeId][stage.key] = { status: agg }
      }
    }
  }

  // Build entities
  for (const nodeId of allNodeIds) {
    const tier = nodeTiers[nodeId]
    const meta = nodeMeta[nodeId]
    const stageMap = nodeStages[nodeId]
    const thumbnail = findThumbnail(basePath, nodePaths[nodeId])

    // Build cells for Grid (feature + stage statuses)
    const featureCell = { text: meta.title, tier, subtitle: meta.what, thumbnail }
    const stageCells = stages.map(s => stageMap[s.key] ?? { status: null })
    const cells = [featureCell, ...stageCells]

    // Build previews
    const previews: Record<string, PreviewContent> = {
      feature: {
        type: 'summary',
        title: `${tier === 'need' ? 'Need' : tier === 'story' ? 'Story' : 'Feature'}: ${meta.title}`,
        body: meta.what ?? '',
      },
    }

    // Stage previews
    for (const stage of stages) {
      const ss = stageMap[stage.key]
      if (!ss || ss.status === null || !ss.artifactPath) continue

      if (ss.artifactPath.endsWith('.md')) {
        previews[stage.key] = { type: 'markdown', path: ss.artifactPath, fallback: `(${stage.label})` }
      } else if (ss.artifactPath.endsWith('.yaml')) {
        const sources = getSourcesList(`/${ss.artifactPath}`)
        if (sources.length > 0) {
          previews[stage.key] = {
            type: 'fileList',
            title: stage.label,
            files: sources.map(s => ({ label: s.split('/').pop() ?? s, path: s })),
          }
        }
      }
    }

    // Detail from pipeline.yaml (how field → markdown preview)
    if (meta.how) {
      const howPath = `${basePath}/${meta.how}`
      previews.prd = { type: 'markdown', path: howPath, fallback: `(${meta.how})` }
    }

    entities[nodeId] = {
      id: nodeId,
      data: {
        label: meta.title,
        tier,
        subtitle: meta.what,
        thumbnail: thumbnail ?? undefined,
        stages: stageMap,
        cells,
        previews,
      },
    }
  }

  return {
    store: createStore({ entities, relationships }),
    columns,
    projectName: pipeline.project,
  }
}

// ── Export ──

export function buildPipelineStore(projectId: string): { store: NormalizedData; columns: ColumnDef[]; projectName: string } {
  return buildFromPipeline(projectId)
}

const defaultProject = buildFromPipeline('cms')
export const pipelineStore = defaultProject.store
export const projectName = defaultProject.projectName
export const PIPELINE_COLUMNS = defaultProject.columns

/** Get preview content for a specific cell */
export function getCellPreview(store: NormalizedData, rowId: string, colKey: string): PreviewContent | null {
  const entity = store.entities[rowId]
  if (!entity) return null
  const data = entity.data as PipelineNode | undefined
  if (!data?.previews) return null
  return data.previews[colKey] ?? null
}

/** Load markdown file content lazily */
export async function loadMarkdown(path: string): Promise<string | null> {
  const key = `/${path}`
  const loader = mdArtifacts[key]
  if (!loader) return null
  return loader()
}

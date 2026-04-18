var e=`/**
 * Features store — load frontmatter files via Vite glob, memoized build.
 *
 * \`/docs/1-projects/features/*.md\` → buildFeatureStore → NormalizedData.
 * Only top-level feature files are loaded; \`prds/\` etc. are excluded by glob.
 */
import { useMemo } from 'react'
import { buildFeatureStore } from './featuresTransform'
import type { BuildResult } from './featuresTransform'
import type { FeatureEntity, Insight } from './featuresSchema'
import type { NormalizedData } from '@os/store/types'

const featureRawModules = import.meta.glob('/docs/1-projects/features/*.md', {
  query: '?raw',
  eager: true,
}) as Record<string, { default: string }>

export interface FeaturesData extends BuildResult {
  insightsByFeatureId: Record<string, Insight[]>
}

function toFiles(modules: Record<string, { default: string }>): Record<string, string> {
  const out: Record<string, string> = {}
  for (const [path, mod] of Object.entries(modules)) out[path] = mod.default
  return out
}

function buildData(files: Record<string, string>): FeaturesData {
  const { store, errors } = buildFeatureStore(files)
  const insightsByFeatureId = deriveInsights(store)
  return { store, errors, insightsByFeatureId }
}

function deriveInsights(store: NormalizedData): Record<string, Insight[]> {
  const out: Record<string, Insight[]> = {}
  for (const [id, entity] of Object.entries(store.entities)) {
    const data = (entity as unknown as FeatureEntity).data
    if (data?.insights) out[id] = data.insights
  }
  return out
}

/** Subscribe to feature files at module load time. Invalidates on HMR. */
export function useFeaturesData(): FeaturesData {
  return useMemo(() => buildData(toFiles(featureRawModules)), [])
}
`;export{e as default};
var e=`/**
 * Features Zod Schema — PM layer SSOT for feature frontmatter + body blocks.
 *
 * Source: docs/1-projects/features/prds/feature-mgmt-view-prd.md ②
 * Status emoji is mapped in UI via indicators/StatusIndicator — schema holds
 * the canonical string form only.
 */
import { z } from 'zod'

export const FeatureStatus = z.enum(['operational', 'prototype', 'concept', 'archived'])
export type FeatureStatus = z.infer<typeof FeatureStatus>

export const FeatureLayer = z.enum(['service', 'engine', 'infra', 'process', 'design'])
export type FeatureLayer = z.infer<typeof FeatureLayer>

export const FeatureMaturity = z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)])
export type FeatureMaturity = z.infer<typeof FeatureMaturity>

export const FeatureFrontmatter = z.object({
  name: z.string(),
  slug: z.string(),
  layer: FeatureLayer,
  status: FeatureStatus,
  maturity: FeatureMaturity,
  parent: z.string().nullable().optional(),
  deps: z.array(z.string()).default([]),
  routes: z.array(z.string()).default([]),
  prds: z.array(z.string()).default([]),
  handoffs: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  created: z.string().optional(),
  last_touched: z.string().optional(),
})
export type FeatureFrontmatter = z.infer<typeof FeatureFrontmatter>

export const Insight = z.object({
  date: z.string().optional(),
  kind: z.string().optional(),
  text: z.string(),
  source: z.string().optional(),
})
export type Insight = z.infer<typeof Insight>

export interface Feature extends FeatureFrontmatter {
  insights: Insight[]
  decisions: string[]
  gaps: string[]
  score: number
}

export interface FeatureEntity {
  id: string
  parentId: string | null
  data: Feature
}

export interface FeatureParseError {
  slug: string
  filePath: string
  reason: string
}
`;export{e as default};
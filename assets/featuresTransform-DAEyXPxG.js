var e=`/**
 * Features transform — raw md → FeatureEntity → NormalizedData.
 *
 * Responsibilities:
 *  - Parse frontmatter (yaml) + body sections (Insights/Decisions/Gaps).
 *  - Detect and recover from structural errors (cycle, dangling parent, duplicate slug).
 *  - Produce NormalizedData<FeatureEntity> with parent/child relationships.
 *
 * Source: feature-mgmt-view-prd.md ② ④
 */
import { parse as parseYaml } from 'yaml'
import { createStore } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData, Entity } from '@os/store/types'
import {
  FeatureFrontmatter,
  type FeatureEntity,
  type FeatureParseError,
  type Feature,
  type Insight,
} from './featuresSchema'

// ── File parse ──

export interface ParsedFeatureFile {
  frontmatter: FeatureFrontmatter
  insights: Insight[]
  decisions: string[]
  gaps: string[]
}

export interface ParseFailure {
  error: string
  filePath: string
}

const FRONTMATTER_RE = /^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n?([\\s\\S]*)$/

/** Parse a single markdown file with yaml frontmatter and body sections. */
export function parseFeatureFile(raw: string, filePath: string): ParsedFeatureFile | ParseFailure {
  const m = FRONTMATTER_RE.exec(raw)
  if (!m) return { error: 'frontmatter block not found (--- … ---)', filePath }

  let yamlObj: unknown
  try {
    yamlObj = parseYaml(m[1])
  } catch (e) {
    return { error: \`yaml parse failed: \${(e as Error).message}\`, filePath }
  }

  const fmResult = FeatureFrontmatter.safeParse(yamlObj)
  if (!fmResult.success) {
    return { error: \`frontmatter schema invalid: \${fmResult.error.issues.map(i => \`\${i.path.join('.')}:\${i.message}\`).join('; ')}\`, filePath }
  }

  const body = m[2]
  const insights = parseInsights(extractSection(body, 'Insights'))
  const decisions = parseList(extractSection(body, 'Decisions'))
  const gaps = parseList(extractSection(body, 'Gaps'))

  return { frontmatter: fmResult.data, insights, decisions, gaps }
}

/** Extract body content under \`## {name}\` header up to next \`## \` or EOF. */
function extractSection(body: string, name: string): string {
  const re = new RegExp(\`^##\\\\s+\${name}\\\\s*$([\\\\s\\\\S]*?)(?=^##\\\\s+|\\\\Z)\`, 'm')
  const m = re.exec(body)
  return m ? m[1] : ''
}

const LIST_ITEM_RE = /^[\\s]*[-*][\\s]+(?:\\[[ xX]\\]\\s+)?(.+)$/gm

function parseList(section: string): string[] {
  const items: string[] = []
  let m: RegExpExecArray | null
  const re = new RegExp(LIST_ITEM_RE.source, LIST_ITEM_RE.flags)
  while ((m = re.exec(section)) !== null) {
    const t = m[1].trim()
    if (t) items.push(t)
  }
  return items
}

/** Insight line grammar:
 *    - {date} · {kind}: {text} [(출처: {source})]
 *  All fields but text are optional. */
const INSIGHT_DATE = /^(\\d{4}-\\d{2}(?:-\\d{2})?)\\s*·\\s*/
const INSIGHT_KIND = /^([^:]{1,40}):\\s*/
const INSIGHT_SOURCE = /\\(출처:\\s*([^)]+)\\)\\s*$/

function parseInsights(section: string): Insight[] {
  const out: Insight[] = []
  const re = new RegExp(LIST_ITEM_RE.source, LIST_ITEM_RE.flags)
  let m: RegExpExecArray | null
  while ((m = re.exec(section)) !== null) {
    let line = m[1].trim()
    if (!line) continue

    let date: string | undefined
    const d = INSIGHT_DATE.exec(line)
    if (d) { date = d[1]; line = line.slice(d[0].length) }

    let source: string | undefined
    const s = INSIGHT_SOURCE.exec(line)
    if (s) { source = s[1].trim(); line = line.slice(0, s.index).trim() }

    let kind: string | undefined
    const k = INSIGHT_KIND.exec(line)
    if (k) { kind = k[1].trim(); line = line.slice(k[0].length) }

    out.push({ date, kind, text: line.trim(), source })
  }
  return out
}

// ── Score ──

/** First-pass score: raw insight count. Tier weighting comes later. */
export function computeScore(insights: Insight[]): number {
  return insights.length
}

// ── Build store ──

export interface BuildResult {
  store: NormalizedData
  errors: FeatureParseError[]
}

/**
 * Normalize all feature files into a single NormalizedData tree.
 *  - Duplicate slugs: first file wins, rest recorded as errors.
 *  - Parse failures: recorded as errors, file skipped.
 *  - Cycle in parent chain: node falls back to ROOT.
 *  - Dangling parent (parent slug does not exist): node falls back to ROOT.
 */
export function buildFeatureStore(files: Record<string, string>): BuildResult {
  const errors: FeatureParseError[] = []
  const features = new Map<string, { feature: Feature; filePath: string }>()

  for (const [filePath, raw] of Object.entries(files)) {
    const parsed = parseFeatureFile(raw, filePath)
    if ('error' in parsed) {
      errors.push({ slug: slugFromPath(filePath), filePath, reason: parsed.error })
      continue
    }
    const fm = parsed.frontmatter
    if (features.has(fm.slug)) {
      errors.push({ slug: fm.slug, filePath, reason: \`duplicate slug; first file \${features.get(fm.slug)!.filePath} wins\` })
      continue
    }
    const feature: Feature = {
      ...fm,
      insights: parsed.insights,
      decisions: parsed.decisions,
      gaps: parsed.gaps,
      score: computeScore(parsed.insights),
    }
    features.set(fm.slug, { feature, filePath })
  }

  // Resolve parent graph with cycle + dangling detection.
  const parentOf = new Map<string, string | null>()
  for (const [slug, { feature, filePath }] of features) {
    const parent = feature.parent ?? null
    if (parent == null) { parentOf.set(slug, null); continue }
    if (!features.has(parent)) {
      errors.push({ slug, filePath, reason: \`dangling parent '\${parent}'; falling back to root\` })
      parentOf.set(slug, null)
      continue
    }
    if (hasCycle(slug, parent, features)) {
      errors.push({ slug, filePath, reason: \`parent cycle detected via '\${parent}'; falling back to root\` })
      parentOf.set(slug, null)
      continue
    }
    parentOf.set(slug, parent)
  }

  // Build entities + relationships.
  const entities: Record<string, Entity> = {}
  const relationships: Record<string, string[]> = { [ROOT_ID]: [] }

  for (const [slug, { feature }] of features) {
    const parent = parentOf.get(slug) ?? null
    const parentId = parent ?? ROOT_ID
    const entity: FeatureEntity = { id: slug, parentId: parent, data: feature }
    entities[slug] = entity as unknown as Entity
    if (!relationships[parentId]) relationships[parentId] = []
    relationships[parentId].push(slug)
  }

  const store = createStore({ entities, relationships })
  return { store, errors }
}

function hasCycle(
  slug: string,
  parent: string,
  features: Map<string, { feature: Feature; filePath: string }>,
): boolean {
  const seen = new Set<string>([slug])
  let cursor: string | null | undefined = parent
  while (cursor) {
    if (seen.has(cursor)) return true
    seen.add(cursor)
    cursor = features.get(cursor)?.feature.parent ?? null
  }
  return false
}

function slugFromPath(filePath: string): string {
  const base = filePath.split('/').pop() ?? filePath
  return base.replace(/\\.md$/, '')
}
`;export{e as default};
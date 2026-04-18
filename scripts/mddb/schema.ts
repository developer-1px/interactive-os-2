// @see docs/2026/2026-04/2026-04-19/mdPathPolicyMigrationPrd.md
/**
 * mddb schema — DocFrontmatter Zod SSOT.
 *
 * 2026-04-19 재설계: 하단 hashtag SSOT 폐기 → frontmatter SSOT.
 * 근거: Jekyll/Hugo/Astro/Docusaurus/Obsidian Properties 업계 사실상 표준.
 *
 * @invariant DocFrontmatterSchema는 .strict() — 알 수 없는 필드는 legacy.*로 격리
 * @invariant type/slug/tags 3필드는 hard required
 * @invariant tags는 frontmatter 배열 (하단 해시태그 파서 폐기)
 * @invariant DATE_FOLDER_RE는 YYYY/YYYY-MM/YYYY-MM-DD/ 3단 폴더 강제
 */
import { z } from 'zod'

// ── 경로 정규식 ────────────────────────────────────────────────
// docs/YYYY/YYYY-MM/YYYY-MM-DD/<slug>.md
// 백레퍼런스로 연도 일관성 강제: '2026/2026-04/2026-04-18/' OK, '2026/2025-04/...' 거부
export const DATE_FOLDER_RE = /^(\d{4})\/\1-(\d{2})\/\1-\2-(\d{2})\//

// ── Slug 정규식 ────────────────────────────────────────────────
// camelCase: 영문 소문자 시작, 이후 영숫자. `_`/`-` 금지 (파일명 = slug 관례).
export const SLUG_RE = /^[a-z][a-zA-Z0-9]*$/

// ── DOC_TYPES ──────────────────────────────────────────────────
export const DOC_TYPES = [
  'prd', 'plan', 'handoff', 'backlog', 'retro', 'audit',
  'explain', 'pyramid', 'minto', 'story', 'ia', 'wireframe',
  'inbox', 'decision', 'area', 'resource', 'archive', 'note',
] as const
export type DocType = typeof DOC_TYPES[number]

export const DOC_STATUSES = [
  'open', 'in_progress', 'consumed', 'merged', 'archived',
] as const
export type DocStatus = typeof DOC_STATUSES[number]

// ── ExtractSource ──────────────────────────────────────────────
export const EXTRACT_SOURCES = [
  'explicit', 'content', 'git', 'mtime', 'filename',
] as const
export type ExtractSource = typeof EXTRACT_SOURCES[number]

export const SOURCE_CONFIDENCE: Record<ExtractSource, 'high' | 'low'> = {
  explicit: 'high',
  content: 'high',
  git: 'high',
  filename: 'high',
  mtime: 'low',
}

// ── DocFrontmatter (Zod SSOT) ──────────────────────────────────
export const DocFrontmatterSchema = z.object({
  id: z.string().min(1)
    .describe('Stable identifier. Default: slug from filename'),
  type: z.enum(DOC_TYPES)
    .describe('Document type. Replaces PARA folder classification'),
  slug: z.string().regex(SLUG_RE, 'camelCase required (^[a-z][a-zA-Z0-9]*$)')
    .describe('File identifier. Matches filename stem'),
  title: z.string().min(1)
    .describe('Display title. Derived from first H1 if absent'),
  tags: z.array(z.string()).min(1, 'at least 1 tag required')
    .describe('Flat tag array from frontmatter. Bottom hashtag line deprecated 2026-04-19'),
  created: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('First-known date. explicit > git --follow > mtime'),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Last-known date. explicit > git -1 > mtime'),
  summary: z.string().optional()
    .describe('1-2 sentence abstract'),
  status: z.enum(DOC_STATUSES).optional()
    .describe('Lifecycle state'),
  project: z.string().optional()
    .describe('Service identifier (cms, viewer, chat, ...)'),
  layer: z.string().optional()
    .describe('Architecture layer (ui, engine, axis, pattern, store, primitives, pages)'),
  consumed_by: z.string().optional()
    .describe('handoff consumption link (relative path)'),
  legacy: z.record(z.string(), z.unknown()).optional()
    .describe('Pre-mddb fields (kind/topics/parent/relates/supersedes/etc) preserved as-is'),
}).strict()

export type DocFrontmatter = z.infer<typeof DocFrontmatterSchema>

// ── Provenance + Warnings ──────────────────────────────────────
export type FieldProvenance = {
  value: unknown
  source: ExtractSource
  confidence: 'high' | 'low'
}

export type ExtractWarning = {
  code:
    | 'missing-frontmatter'
    | 'missing-type'
    | 'missing-slug'
    | 'missing-tags'
    | 'schema-invalid'
    | 'date-path-mismatch'
    | 'slug-filename-mismatch'
    | 'legacy-field-preserved'
    | 'created-after-updated'
    | 'duplicate-id'
    | 'duplicate-slug'
    | 'untracked-mtime-fallback'
  field?: keyof DocFrontmatter
  message: string
  severity: 'error' | 'warn' | 'info'
}

export type ExtractResult = {
  path: string
  frontmatter: DocFrontmatter
  provenance: Partial<Record<keyof DocFrontmatter, FieldProvenance>>
  warnings: ExtractWarning[]
}

// ── Legacy 필드 보존 매핑 ──────────────────────────────────────
// frontmatter에 남아있는 PARA·구 mddb 필드를 canonical 필드로 옮기거나 legacy.*로 보존.
export const LEGACY_FIELD_RENAMES: Readonly<Record<string, keyof DocFrontmatter>> = {
  created_at: 'created',
  date: 'created',
  last_touched: 'updated',
  name: 'title',
  kind: 'type',
}

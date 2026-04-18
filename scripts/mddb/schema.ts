// @see docs/2-areas/docs-infra/prds/mddb-phase1-prd.md
/**
 * mddb schema — DocFrontmatter Zod SSOT + enum/mapping tables.
 *
 * §1 데이터 모델의 유일 진실. 다른 모든 mddb 파일이 이 파일로부터 import.
 *
 * @invariant DocFrontmatterSchema는 .strict() — 알 수 없는 필드는 legacy.*로 격리
 * @invariant STATUS_VALUES/KIND_VALUES/EXTRACT_SOURCES는 as const readonly tuple
 * @invariant FOLDER_STATUS_MAP은 docs/ 모든 폴더에 대해 surjective
 * @invariant SOURCE_CONFIDENCE는 모든 ExtractSource에 대해 total mapping
 */
import { z } from 'zod'

// ── Enums ──

export const STATUS_VALUES = [
  'inbox',       // docs/0-inbox/
  'active',      // docs/1-projects/, docs/2-areas/
  'reference',   // docs/3-resources/
  'archived',    // docs/4-archive/
  'backlog',     // docs/5-backlogs/
  'research',    // docs/research/
  'sample',      // docs/samples/
  'meta',        // docs/superpowers/ | docs/birdseye/ | docs/ (root)
] as const
export type DocStatus = typeof STATUS_VALUES[number]

export const KIND_VALUES = [
  // 문서 계열 (규약 높음)
  'prd', 'plan', 'handoff', 'summary', 'readme', 'backlog',
  // 내용 계열 (태그/내용 기반)
  'audit', 'retro', 'explain', 'decision', 'design', 'research',
  'methodology', 'pattern', 'tooling', 'analysis', 'report', 'protocol',
  'i18n', 'vision', 'ideal', 'library', 'event', 'memo', 'idea', 'pyramid',
  // 기본값
  'note',
] as const
export type DocKind = typeof KIND_VALUES[number]

export const EXTRACT_SOURCES = [
  'explicit', 'content', 'filename', 'folder', 'git', 'mtime', 'default',
] as const
export type ExtractSource = typeof EXTRACT_SOURCES[number]

// source → confidence (§1.2 표)
export const SOURCE_CONFIDENCE: Record<ExtractSource, 'high' | 'medium' | 'low'> = {
  explicit: 'high',
  content: 'high',
  filename: 'high',
  folder: 'high',
  git: 'high',
  mtime: 'low',
  default: 'low',
}

// ── Core schema ──

export const DocFrontmatterSchema = z.object({
  id: z.string().min(1)
    .describe('Stable identifier. Default: slug from filename'),
  title: z.string().min(1)
    .describe('Display title. Derived from first H1 if absent'),
  status: z.enum(STATUS_VALUES)
    .describe('Lifecycle state. L0 derives from folder path'),
  kind: z.enum(KIND_VALUES)
    .describe('Document type. L0 derives from filename convention'),
  created: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('First-known date. git log → filename date → mtime'),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Last-known date. git log → mtime'),
  summary: z.string().optional()
    .describe('1-2 sentence abstract'),
  topics: z.array(z.string()).default([])
    .describe('Subject tags. L0: folder + filename [tag]'),
  parent: z.string().optional()
    .describe('Parent doc id (knowledge hierarchy)'),
  relates: z.array(z.string()).default([])
    .describe('Related doc ids (loose relation)'),
  supersedes: z.array(z.string()).default([])
    .describe('Docs this supersedes'),
  superseded_by: z.string().optional()
    .describe('Doc that supersedes this'),
  legacy: z.record(z.string(), z.unknown()).optional()
    .describe('Pre-mddb fields (name/slug/layer/maturity/deps/etc). Preserved as-is'),
}).strict()

export type DocFrontmatter = z.infer<typeof DocFrontmatterSchema>

// ── ExtractResult + Provenance ──

export type FieldProvenance = {
  value: unknown
  source: ExtractSource
  confidence: 'high' | 'medium' | 'low'
}

export type ExtractWarning = {
  code:
    | 'missing-frontmatter'
    | 'schema-invalid'
    | 'status-folder-mismatch'
    | 'kind-filename-mismatch'
    | 'created-after-updated'
    | 'supersede-cycle'
    | 'untracked-mtime-fallback'
    | 'legacy-field-preserved'
    | 'topic-fallback-empty'
    | 'parent-not-found'
    | 'duplicate-id'
    | 'superseded-by-not-found'
    | 'self-relate'
    | 'future-date'
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

// ── Mapping tables (§1.3) ──

// §1.3.1 FolderStatusMap — docs/ 첫 segment → status
export const FOLDER_STATUS_MAP: Readonly<Record<string, DocStatus>> = {
  '0-inbox': 'inbox',
  '1-projects': 'active',
  '2-areas': 'active',
  '3-resources': 'reference',
  '4-archive': 'archived',
  '5-backlogs': 'backlog',
  'research': 'research',
  'samples': 'sample',
  'superpowers': 'meta',
  'birdseye': 'meta',
  '': 'meta', // docs/ 루트
}

// §1.3.2 파일명 → kind 패턴 (우선순위 순서)
export type FilenameKindPattern = {
  regex: RegExp
  kind: DocKind | 'tag-lookup'
  extract?: (match: RegExpMatchArray) => {
    topics?: string[]
    createdFromFilename?: string
    sortIndex?: number
  }
}

export const FILENAME_KIND_PATTERNS: readonly FilenameKindPattern[] = [
  { regex: /^README\.md$/i, kind: 'readme' },
  { regex: /^summary\.md$/i, kind: 'summary' },
  {
    regex: /^handoff-(\d{4}-\d{2}-\d{2})(?:-(.+))?\.md$/,
    kind: 'handoff',
    extract: (m) => ({ createdFromFilename: m[1] }),
  },
  { regex: /^pyramid-.+\.md$/, kind: 'pyramid' },
  { regex: /^explain-.+\.md$/, kind: 'explain' },
  {
    regex: /^(\d+)-\[([^\]]+)\](.+)\.md$/,
    kind: 'tag-lookup',
    extract: (m) => ({
      topics: [m[2].toLowerCase()],
      sortIndex: Number(m[1]),
    }),
  },
  { regex: /.*-prd\.md$/, kind: 'prd' },
  { regex: /.*-plan\.md$/, kind: 'plan' },
  { regex: /.*-task\.md$/, kind: 'plan' },
]

// §1.3.2 tag → kind 재귀 lookup
export const TAG_KIND_MAP: Readonly<Record<string, DocKind>> = {
  backlog: 'backlog',
  audit: 'audit',
  retro: 'retro',
  retrospective: 'retro',
  explain: 'explain',
  decision: 'decision',
  adr: 'decision',
  design: 'design',
  methodology: 'methodology',
  method: 'methodology',
  pattern: 'pattern',
  tooling: 'tooling',
  tool: 'tooling',
  analysis: 'analysis',
  report: 'report',
  protocol: 'protocol',
  i18n: 'i18n',
  locale: 'i18n',
  vision: 'vision',
  manifesto: 'vision',
  ideal: 'ideal',
  library: 'library',
  lib: 'library',
  event: 'event',
  memo: 'memo',
  idea: 'idea',
}

// §1.3.3 legacy field 정규화 매핑
export const LEGACY_FIELD_RENAMES: Readonly<Record<string, keyof DocFrontmatter>> = {
  created_at: 'created',
  date: 'created',
  last_touched: 'updated',
  name: 'title',
  slug: 'id',
  tags: 'topics',
}

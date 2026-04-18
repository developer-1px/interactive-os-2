// @see docs/2-areas/docs-infra/prds/mddb-lite-prd.md
/**
 * mddb schema — DocFrontmatter Zod SSOT (lite).
 *
 * Phase 1 (PARA + frontmatter inject)을 폐기하고 마지막 줄 hashtag 컨벤션으로 축소.
 *
 * @invariant DocFrontmatterSchema는 .strict() — 알 수 없는 필드는 legacy.*로 격리
 * @invariant tags 는 hashtag 토큰 배열 (# 접두어 제거됨, 슬래시 계층 보존)
 * @invariant status/kind/topics 같은 파생은 viewer/runtime이 tags prefix 필터로 계산
 * @invariant DATE_FOLDER_RE는 YYYY/YYYY-MM/YYYY-MM-DD/ 3단 폴더 강제
 */
import { z } from 'zod'

// ── Hashtag 정규식 ──────────────────────────────────────────────
// Mastodon/Obsidian 교집합. 한글·숫자·영문·`_`·`-`·`/` 허용.
// 줄 전체가 #토큰들(공백 구분)만으로 구성될 때만 매칭.
export const HASHTAG_LINE_RE =
  /^#[\p{L}\p{N}_/-]+(\s+#[\p{L}\p{N}_/-]+)*\s*$/u

// 단일 토큰 추출 (# 접두어 제거 후 캡처)
export const HASHTAG_TOKEN_RE = /^#([\p{L}\p{N}_/-]+)$/u

// 숫자-only 토큰 (GitHub `#123` issue 링크 충돌 방지)
export const NUMERIC_ONLY_HASHTAG_RE = /^#\d+$/

// ── 경로 정규식 ────────────────────────────────────────────────
// docs/YYYY/YYYY-MM/YYYY-MM-DD/<slug>.md
// 백레퍼런스로 연도 일관성 강제: '2026/2026-04/2026-04-18/' OK, '2026/2025-04/...' 거부
export const DATE_FOLDER_RE = /^(\d{4})\/\1-(\d{2})\/\1-\2-(\d{2})\//

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
  title: z.string().min(1)
    .describe('Display title. Derived from first H1 if absent'),
  created: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('First-known date. explicit > git --follow > mtime'),
  updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/)
    .describe('Last-known date. explicit > git -1 > mtime'),
  summary: z.string().optional()
    .describe('1-2 sentence abstract'),
  tags: z.array(z.string()).default([])
    .describe('Hashtag tokens from last non-blank line (# stripped, slash hierarchy preserved)'),
  legacy: z.record(z.string(), z.unknown()).optional()
    .describe('Pre-mddb fields (status/kind/topics/parent/relates/supersedes/etc) preserved as-is'),
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
    | 'schema-invalid'
    | 'date-path-mismatch'
    | 'hashtag-line-malformed'
    | 'numeric-only-hashtag'
    | 'untracked-mtime-fallback'
    | 'legacy-field-preserved'
    | 'created-after-updated'
    | 'duplicate-id'
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

// ── Legacy 필드 보존 매핑 (축소) ────────────────────────────────
// frontmatter에 남아있는 PARA·구 mddb 필드를 legacy.* 로 옮길 때 사용.
// rename 대상은 created/title/updated 셋만 — 나머지는 legacy로 보존.
export const LEGACY_FIELD_RENAMES: Readonly<Record<string, keyof DocFrontmatter>> = {
  created_at: 'created',
  date: 'created',
  last_touched: 'updated',
  name: 'title',
}

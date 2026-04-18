// @see docs/2026/2026-04/2026-04-19/mdPathPolicyMigrationPrd.md
/**
 * Validation — Zod safeParse + duplicate-id/slug + date-path 정합.
 *
 * 2026-04-19 재설계: type/slug/tags missing 구분 warning 추가.
 *
 * @invariant validateExtract/validateAll 는 pure (파일 IO 없음)
 * @invariant severity='error'는 CI block 대상
 * @invariant hashtag 관련 warning은 더 이상 발생하지 않음 (폐기)
 */
import { DocFrontmatterSchema } from './schema.ts'
import type { ExtractResult, ExtractWarning } from './schema.ts'

export type ValidationReport = {
  total: number
  passed: number
  failed: number
  errors: ExtractWarning[]
  warnings: ExtractWarning[]
  byCode: Record<string, number>
}

export function validateExtract(result: ExtractResult): ExtractWarning[] {
  const out: ExtractWarning[] = []

  const parsed = DocFrontmatterSchema.safeParse(result.frontmatter)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      const code = mapIssuePathToCode(path)
      const warning: ExtractWarning = {
        code,
        severity: 'error',
        message: `${path}: ${issue.message}`,
      }
      if (isFrontmatterKey(path)) warning.field = path
      out.push(warning)
    }
  }

  if (result.frontmatter.created && result.frontmatter.updated
    && result.frontmatter.created > result.frontmatter.updated) {
    out.push({
      code: 'created-after-updated',
      field: 'updated',
      severity: 'warn',
      message: `created=${result.frontmatter.created} > updated=${result.frontmatter.updated}`,
    })
  }

  // dedupe with extract-stage warnings
  const seen = new Set<string>()
  const merged: ExtractWarning[] = []
  for (const w of [...result.warnings, ...out]) {
    const key = `${w.code}|${w.field ?? ''}|${w.message}`
    if (seen.has(key)) continue
    seen.add(key)
    merged.push(w)
  }
  return merged
}

function mapIssuePathToCode(path: string): ExtractWarning['code'] {
  if (path === 'type') return 'missing-type'
  if (path === 'slug') return 'missing-slug'
  if (path === 'tags') return 'missing-tags'
  return 'schema-invalid'
}

const FRONTMATTER_KEYS = new Set([
  'id', 'type', 'slug', 'title', 'tags', 'created', 'updated',
  'summary', 'status', 'project', 'layer', 'consumed_by', 'legacy',
])

function isFrontmatterKey(path: string): path is keyof import('./schema.ts').DocFrontmatter {
  return FRONTMATTER_KEYS.has(path)
}

/**
 * 전체 DB 검증: duplicate-id + duplicate-slug.
 */
export function validateGlobal(all: ExtractResult[]): ExtractWarning[] {
  const out: ExtractWarning[] = []
  const idToPath = new Map<string, string[]>()
  const slugToPath = new Map<string, string[]>()
  for (const r of all) {
    const id = r.frontmatter.id
    const idArr = idToPath.get(id) ?? []
    idArr.push(r.path)
    idToPath.set(id, idArr)

    const slug = r.frontmatter.slug
    if (slug) {
      const slugArr = slugToPath.get(slug) ?? []
      slugArr.push(r.path)
      slugToPath.set(slug, slugArr)
    }
  }
  for (const [id, paths] of idToPath.entries()) {
    if (paths.length > 1) {
      out.push({
        code: 'duplicate-id',
        field: 'id',
        severity: 'error',
        message: `duplicate id="${id}" in: ${paths.join(', ')}`,
      })
    }
  }
  for (const [slug, paths] of slugToPath.entries()) {
    if (paths.length > 1) {
      out.push({
        code: 'duplicate-slug',
        field: 'slug',
        severity: 'error',
        message: `duplicate slug="${slug}" in: ${paths.join(', ')}`,
      })
    }
  }
  return out
}

export function validateAll(results: ExtractResult[]): ValidationReport {
  const byCode: Record<string, number> = {}
  const allWarnings: ExtractWarning[] = []

  for (const r of results) {
    const ws = validateExtract(r)
    for (const w of ws) {
      allWarnings.push(w)
      byCode[w.code] = (byCode[w.code] ?? 0) + 1
    }
  }
  const globalWarnings = validateGlobal(results)
  for (const w of globalWarnings) {
    allWarnings.push(w)
    byCode[w.code] = (byCode[w.code] ?? 0) + 1
  }

  const errors = allWarnings.filter((w) => w.severity === 'error')
  const warnings = allWarnings.filter((w) => w.severity !== 'error')

  const failedIds = new Set<string>()
  for (const r of results) {
    const ws = validateExtract(r)
    if (ws.some((w) => w.severity === 'error')) failedIds.add(r.path)
  }
  for (const w of globalWarnings) {
    if (w.severity !== 'error') continue
    for (const r of results) {
      if (w.message.includes(`"${r.frontmatter.id}"`) || w.message.includes(r.path)) {
        failedIds.add(r.path)
      }
    }
  }

  return {
    total: results.length,
    passed: results.length - failedIds.size,
    failed: failedIds.size,
    errors,
    warnings,
    byCode,
  }
}

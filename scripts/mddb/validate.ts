// @see docs/2-areas/docs-infra/prds/mddb-lite-prd.md
/**
 * Validation (lite) — Zod safeParse + duplicate-id + date-path 정합.
 *
 * @invariant validateExtract/validateAll 는 pure (파일 IO 없음)
 * @invariant severity='error'는 CI block 대상
 * @invariant supersede-cycle / parent / superseded_by 검증은 폐기 (필드 자체 제거됨)
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
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    if (!result.warnings.some((w) => w.code === 'schema-invalid')) {
      out.push({ code: 'schema-invalid', severity: 'error', message: msg })
    }
  }

  if (result.frontmatter.created > result.frontmatter.updated) {
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

/**
 * 전체 DB 검증: duplicate-id 만.
 */
export function validateGlobal(all: ExtractResult[]): ExtractWarning[] {
  const out: ExtractWarning[] = []
  const idToPath = new Map<string, string[]>()
  for (const r of all) {
    const id = r.frontmatter.id
    const arr = idToPath.get(id) ?? []
    arr.push(r.path)
    idToPath.set(id, arr)
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

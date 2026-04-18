// @see docs/2-areas/docs-infra/prds/mddb-phase1-prd.md
/**
 * Validation — Zod safeParse + 불변식 #1~#7 검사.
 *
 * @invariant 불변식 8개(§1.5) ↔ warning code ↔ validate 분기가 1:1 대응
 * @invariant validateExtract/validateCycle는 pure (파일 IO 없음)
 * @invariant severity='error'는 CI block 대상, 'warn'/'info'는 리포트만
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

  // 1. Zod 재검증 (이미 extract에서 했지만 defense in depth)
  const parsed = DocFrontmatterSchema.safeParse(result.frontmatter)
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')
    if (!result.warnings.some((w) => w.code === 'schema-invalid')) {
      out.push({ code: 'schema-invalid', severity: 'error', message: msg })
    }
  }

  // 2. created ≤ updated
  if (result.frontmatter.created > result.frontmatter.updated) {
    out.push({
      code: 'created-after-updated',
      field: 'updated',
      severity: 'warn',
      message: `created=${result.frontmatter.created} > updated=${result.frontmatter.updated}`,
    })
  }

  // extract 단계 warnings와 합성 + dedupe
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
 * 전체 DB 필요한 검증: 순환 + dangling reference.
 *
 * @invariant DFS로 supersedes 체인 순환 탐지
 * @invariant parent/superseded_by가 전체 id 집합에 없으면 dangling warning
 */
export function validateCycle(all: ExtractResult[]): ExtractWarning[] {
  const out: ExtractWarning[] = []

  // id 집합
  const idSet = new Set<string>()
  const idToPath = new Map<string, string[]>()
  for (const r of all) {
    const id = r.frontmatter.id
    idSet.add(id)
    const arr = idToPath.get(id) ?? []
    arr.push(r.path)
    idToPath.set(id, arr)
  }

  // duplicate-id
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

  // supersede cycle DFS
  const supersedeGraph = new Map<string, string[]>()
  for (const r of all) {
    supersedeGraph.set(r.frontmatter.id, r.frontmatter.supersedes)
  }

  const cycleNodes = new Set<string>()
  for (const start of supersedeGraph.keys()) {
    if (cycleNodes.has(start)) continue
    const stack: string[] = [start]
    const onPath = new Set<string>([start])
    const visited = new Set<string>()
    const visit = (node: string): boolean => {
      if (visited.has(node)) return false
      visited.add(node)
      const nexts = supersedeGraph.get(node) ?? []
      for (const n of nexts) {
        if (onPath.has(n)) {
          // cycle found — mark all nodes on path
          for (const p of stack) cycleNodes.add(p)
          cycleNodes.add(n)
          return true
        }
        stack.push(n)
        onPath.add(n)
        if (visit(n)) return true
        stack.pop()
        onPath.delete(n)
      }
      return false
    }
    visit(start)
  }
  for (const id of cycleNodes) {
    out.push({
      code: 'supersede-cycle',
      field: 'supersedes',
      severity: 'error',
      message: `supersede cycle involves id="${id}"`,
    })
  }

  // parent / superseded_by dangling
  for (const r of all) {
    if (r.frontmatter.parent && !idSet.has(r.frontmatter.parent)) {
      out.push({
        code: 'parent-not-found',
        field: 'parent',
        severity: 'warn',
        message: `parent="${r.frontmatter.parent}" (file=${r.path}) not found in DB`,
      })
    }
    if (r.frontmatter.superseded_by && !idSet.has(r.frontmatter.superseded_by)) {
      out.push({
        code: 'superseded-by-not-found',
        field: 'superseded_by',
        severity: 'warn',
        message: `superseded_by="${r.frontmatter.superseded_by}" (file=${r.path}) not found in DB`,
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
  const cycleWarnings = validateCycle(results)
  for (const w of cycleWarnings) {
    allWarnings.push(w)
    byCode[w.code] = (byCode[w.code] ?? 0) + 1
  }

  const errors = allWarnings.filter((w) => w.severity === 'error')
  const warnings = allWarnings.filter((w) => w.severity !== 'error')

  // passed/failed per file
  const failedIds = new Set<string>()
  // errors are aggregated elsewhere; per-file failure computed below.
  for (const r of results) {
    const ws = validateExtract(r)
    if (ws.some((w) => w.severity === 'error')) failedIds.add(r.path)
  }
  // cycle/duplicate: mark every result whose id/path referenced
  for (const w of cycleWarnings) {
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

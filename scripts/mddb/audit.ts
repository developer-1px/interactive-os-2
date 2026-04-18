// @see docs/2-areas/docs-infra/prds/mddb-phase1-prd.md
/**
 * Audit — 전체 docs/ 통계 리포트.
 *
 * @invariant runAudit는 read-only (파일 수정 없음)
 * @invariant renderAuditMarkdown은 pure
 * @invariant byStatus/byKind는 enum 전체 key 존재 (0이어도 entry 포함)
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { extractAll } from './extract.ts'
import { validateAll } from './validate.ts'
import { folder0, DOCS_ROOT } from './paths.ts'
import {
  STATUS_VALUES,
  KIND_VALUES,
} from './schema.ts'
import type { DocStatus, DocKind, ExtractWarning, ExtractResult } from './schema.ts'

export type AuditReport = {
  total: number
  frontmatterRate: { withFm: number; withoutFm: number; ratio: number }
  byStatus: Record<DocStatus, number>
  byKind: Record<DocKind, number>
  byFolder: Record<string, number>
  fallbackUsage: {
    kindDefault: number
    mtimeOnly: number
    titleFromFilename: number
  }
  warnings: ExtractWarning[]
  warningsByCode: Record<string, number>
  generatedAt: string
  // 정책 감시 (§5.3)
  policyWatch: {
    statusFolderMismatch: number
    kindFilenameMismatch: number
    thresholdWarn: number  // 10
    thresholdFail: number  // 50
    shouldWarn: boolean
    shouldFail: boolean
  }
}

function zeroByStatus(): Record<DocStatus, number> {
  const o = {} as Record<DocStatus, number>
  for (const s of STATUS_VALUES) o[s] = 0
  return o
}
function zeroByKind(): Record<DocKind, number> {
  const o = {} as Record<DocKind, number>
  for (const k of KIND_VALUES) o[k] = 0
  return o
}

export async function runAudit(opts?: { root?: string }): Promise<AuditReport> {
  const results = await extractAll({ root: opts?.root ?? DOCS_ROOT })
  return buildReport(results)
}

export function buildReport(results: ExtractResult[]): AuditReport {
  const byStatus = zeroByStatus()
  const byKind = zeroByKind()
  const byFolder: Record<string, number> = {}

  let withFm = 0
  let withoutFm = 0
  let kindDefault = 0
  let mtimeOnly = 0
  let titleFromFilename = 0

  for (const r of results) {
    byStatus[r.frontmatter.status] = (byStatus[r.frontmatter.status] ?? 0) + 1
    byKind[r.frontmatter.kind] = (byKind[r.frontmatter.kind] ?? 0) + 1
    const f = folder0(r.path) || '(root)'
    byFolder[f] = (byFolder[f] ?? 0) + 1

    // frontmatter 보유 여부: missing-frontmatter warning이 없으면 있었던 것
    const missingFm = r.warnings.some((w) => w.code === 'missing-frontmatter')
    if (missingFm) withoutFm++
    else withFm++

    if (r.provenance.kind?.source === 'default') kindDefault++
    if (r.provenance.created?.source === 'mtime' || r.provenance.updated?.source === 'mtime') mtimeOnly++
    if (r.provenance.title?.source === 'filename') titleFromFilename++
  }

  const validation = validateAll(results)
  // validation.byCode already aggregates extractResult warnings via validateExtract.
  const warningsByCode: Record<string, number> = { ...validation.byCode }
  const allWarnings = [...validation.errors, ...validation.warnings]

  const statusFolderMismatch = warningsByCode['status-folder-mismatch'] ?? 0
  const kindFilenameMismatch = warningsByCode['kind-filename-mismatch'] ?? 0
  const thresholdWarn = 10
  const thresholdFail = 50

  return {
    total: results.length,
    frontmatterRate: {
      withFm,
      withoutFm,
      ratio: results.length === 0 ? 0 : withFm / results.length,
    },
    byStatus,
    byKind,
    byFolder,
    fallbackUsage: {
      kindDefault,
      mtimeOnly,
      titleFromFilename,
    },
    warnings: allWarnings,
    warningsByCode,
    generatedAt: new Date().toISOString(),
    policyWatch: {
      statusFolderMismatch,
      kindFilenameMismatch,
      thresholdWarn,
      thresholdFail,
      shouldWarn: statusFolderMismatch + kindFilenameMismatch >= thresholdWarn,
      shouldFail: statusFolderMismatch + kindFilenameMismatch >= thresholdFail,
    },
  }
}

export function renderAuditMarkdown(report: AuditReport): string {
  const lines: string[] = []
  lines.push(`# mddb audit — ${report.generatedAt.slice(0, 10)}`)
  lines.push('')
  lines.push('## §1 전체 통계')
  lines.push('')
  lines.push(`- 총 파일: **${report.total}**`)
  lines.push(`- frontmatter 보유: **${report.frontmatterRate.withFm}** (${(report.frontmatterRate.ratio * 100).toFixed(1)}%)`)
  lines.push(`- frontmatter 없음: **${report.frontmatterRate.withoutFm}**`)
  lines.push('')

  if (report.policyWatch.shouldFail) {
    lines.push('## 🔴 정책 대응 필요 (CI 실패 — 임계치 50 초과)')
    lines.push('')
    lines.push(`- status-folder-mismatch: ${report.policyWatch.statusFolderMismatch}`)
    lines.push(`- kind-filename-mismatch: ${report.policyWatch.kindFilenameMismatch}`)
    lines.push('')
  } else if (report.policyWatch.shouldWarn) {
    lines.push('## 🟡 정책 재검토 권고 (임계치 10 초과)')
    lines.push('')
    lines.push(`- status-folder-mismatch: ${report.policyWatch.statusFolderMismatch}`)
    lines.push(`- kind-filename-mismatch: ${report.policyWatch.kindFilenameMismatch}`)
    lines.push('')
  }

  lines.push('## §2 status 분포')
  lines.push('')
  lines.push('| status | count |')
  lines.push('|--------|------:|')
  for (const s of STATUS_VALUES) {
    lines.push(`| ${s} | ${report.byStatus[s]} |`)
  }
  lines.push('')

  lines.push('## §3 kind 분포')
  lines.push('')
  lines.push('| kind | count |')
  lines.push('|------|------:|')
  for (const k of KIND_VALUES) {
    if (report.byKind[k] > 0) lines.push(`| ${k} | ${report.byKind[k]} |`)
  }
  lines.push('')

  lines.push('## §4 folder 분포')
  lines.push('')
  lines.push('| folder | count |')
  lines.push('|--------|------:|')
  for (const [f, c] of Object.entries(report.byFolder).sort()) {
    lines.push(`| ${f} | ${c} |`)
  }
  lines.push('')

  lines.push('## §5 fallback 사용률')
  lines.push('')
  lines.push('| source | count |')
  lines.push('|--------|------:|')
  lines.push(`| kind='note' fallback | ${report.fallbackUsage.kindDefault} |`)
  lines.push(`| mtime 사용 | ${report.fallbackUsage.mtimeOnly} |`)
  lines.push(`| title=filename | ${report.fallbackUsage.titleFromFilename} |`)
  lines.push('')

  lines.push('## §6 warning 집계')
  lines.push('')
  if (Object.keys(report.warningsByCode).length === 0) {
    lines.push('warning 없음.')
  } else {
    lines.push('| code | count |')
    lines.push('|------|------:|')
    for (const [code, c] of Object.entries(report.warningsByCode).sort()) {
      lines.push(`| ${code} | ${c} |`)
    }
  }
  lines.push('')

  return lines.join('\n') + '\n'
}

export async function writeAuditFile(report: AuditReport, outPath?: string): Promise<string> {
  const date = report.generatedAt.slice(0, 10)
  const target = outPath ?? resolve(DOCS_ROOT, '0-inbox', `mddb-audit-${date}.md`)
  await mkdir(dirname(target), { recursive: true })
  await writeFile(target, renderAuditMarkdown(report), 'utf8')
  return target
}

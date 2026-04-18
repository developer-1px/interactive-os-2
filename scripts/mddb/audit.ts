// @see docs/2026/2026-04/2026-04-19/mdPathPolicyMigrationPrd.md
/**
 * Audit (lite) — 전체 docs/ 통계 리포트.
 *
 * @invariant runAudit는 read-only (파일 수정 없음)
 * @invariant renderAuditMarkdown은 pure
 * @invariant 리포트 섹션: 일/주/월 분포 + tag 커버리지 + date-path 정합 + warning 집계
 */
import { writeFile, mkdir } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { extractAll } from './extract.ts'
import { validateAll } from './validate.ts'
import { DOCS_ROOT, parseDatePath } from './paths.ts'
import type { ExtractWarning, ExtractResult } from './schema.ts'

export type AuditReport = {
  total: number
  frontmatterRate: { withFm: number; withoutFm: number; ratio: number }
  hashtagRate: { withTags: number; withoutTags: number; ratio: number }
  datePathRate: { underDateFolder: number; orphan: number; ratio: number }
  byTagNamespace: Record<string, number>
  byDay: Record<string, number>
  byMonth: Record<string, number>
  topDays: Array<{ day: string; count: number }>
  fallbackUsage: { mtimeOnly: number; titleFromFilename: number }
  warnings: ExtractWarning[]
  warningsByCode: Record<string, number>
  generatedAt: string
  policyWatch: { datePathMismatch: number; thresholdWarn: number; thresholdFail: number; shouldWarn: boolean; shouldFail: boolean }
}

export async function runAudit(opts?: { root?: string }): Promise<AuditReport> {
  const results = await extractAll({ root: opts?.root ?? DOCS_ROOT })
  return buildReport(results)
}

export function buildReport(results: ExtractResult[]): AuditReport {
  const byTagNamespace: Record<string, number> = {}
  const byDay: Record<string, number> = {}
  const byMonth: Record<string, number> = {}

  let withFm = 0
  let withoutFm = 0
  let withTags = 0
  let withoutTags = 0
  let underDateFolder = 0
  let orphan = 0
  let mtimeOnly = 0
  let titleFromFilename = 0

  for (const r of results) {
    const missingFm = r.warnings.some((w) => w.code === 'missing-frontmatter')
    if (missingFm) withoutFm++; else withFm++

    if (r.frontmatter.tags.length > 0) withTags++; else withoutTags++

    const datePath = parseDatePath(r.path)
    if (datePath) underDateFolder++; else orphan++

    if (r.provenance.created?.source === 'mtime' || r.provenance.updated?.source === 'mtime') mtimeOnly++
    if (r.provenance.title?.source === 'filename') titleFromFilename++

    for (const tag of r.frontmatter.tags) {
      const ns = tag.includes('/') ? tag.split('/')[0] : '(flat)'
      byTagNamespace[ns] = (byTagNamespace[ns] ?? 0) + 1
    }

    const day = r.frontmatter.created
    byDay[day] = (byDay[day] ?? 0) + 1
    const month = day.slice(0, 7)
    byMonth[month] = (byMonth[month] ?? 0) + 1
  }

  const validation = validateAll(results)
  const warningsByCode: Record<string, number> = { ...validation.byCode }
  const allWarnings = [...validation.errors, ...validation.warnings]

  const datePathMismatch = warningsByCode['date-path-mismatch'] ?? 0
  const thresholdWarn = 10
  const thresholdFail = 50

  const topDays = Object.entries(byDay)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([day, count]) => ({ day, count }))

  return {
    total: results.length,
    frontmatterRate: { withFm, withoutFm, ratio: results.length === 0 ? 0 : withFm / results.length },
    hashtagRate: { withTags, withoutTags, ratio: results.length === 0 ? 0 : withTags / results.length },
    datePathRate: { underDateFolder, orphan, ratio: results.length === 0 ? 0 : underDateFolder / results.length },
    byTagNamespace,
    byDay,
    byMonth,
    topDays,
    fallbackUsage: { mtimeOnly, titleFromFilename },
    warnings: allWarnings,
    warningsByCode,
    generatedAt: new Date().toISOString(),
    policyWatch: {
      datePathMismatch,
      thresholdWarn,
      thresholdFail,
      shouldWarn: datePathMismatch >= thresholdWarn,
      shouldFail: datePathMismatch >= thresholdFail,
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
  lines.push(`- hashtag 라인 보유: **${report.hashtagRate.withTags}** (${(report.hashtagRate.ratio * 100).toFixed(1)}%)`)
  lines.push(`- date 경로 정착: **${report.datePathRate.underDateFolder}** (${(report.datePathRate.ratio * 100).toFixed(1)}%) — orphan ${report.datePathRate.orphan}`)
  lines.push('')

  if (report.policyWatch.shouldFail) {
    lines.push('## 🔴 정책 대응 필요 (CI 실패 — 임계치 50 초과)')
    lines.push(`- date-path-mismatch: ${report.policyWatch.datePathMismatch}`)
    lines.push('')
  } else if (report.policyWatch.shouldWarn) {
    lines.push('## 🟡 정책 재검토 권고 (임계치 10 초과)')
    lines.push(`- date-path-mismatch: ${report.policyWatch.datePathMismatch}`)
    lines.push('')
  }

  lines.push('## §2 tag namespace 분포')
  lines.push('')
  lines.push('| namespace | count |')
  lines.push('|-----------|------:|')
  for (const [ns, c] of Object.entries(report.byTagNamespace).sort((a, b) => b[1] - a[1])) {
    lines.push(`| ${ns} | ${c} |`)
  }
  if (Object.keys(report.byTagNamespace).length === 0) lines.push('_(없음)_')
  lines.push('')

  lines.push('## §3 월별 분포')
  lines.push('')
  lines.push('| month | count |')
  lines.push('|-------|------:|')
  for (const [m, c] of Object.entries(report.byMonth).sort()) {
    lines.push(`| ${m} | ${c} |`)
  }
  lines.push('')

  lines.push('## §4 일별 상위 10')
  lines.push('')
  lines.push('| day | count |')
  lines.push('|-----|------:|')
  for (const { day, count } of report.topDays) {
    lines.push(`| ${day} | ${count} |`)
  }
  lines.push('')

  lines.push('## §5 fallback 사용률')
  lines.push('')
  lines.push('| source | count |')
  lines.push('|--------|------:|')
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

#!/usr/bin/env node
// @ts-check
/**
 * verifyRadiusUsage — P-12 Shape Family: border-radius 토큰 사용률
 *
 * 목적: CSS 전체에서 border-radius 선언이 --shape-*-radius 토큰 체인을 쓰는지,
 *   아니면 raw px 값을 사용하는지 감사.
 *
 * 허용:
 *   - `var(--*)` 모든 CSS 변수 (--shape-* 뿐 아니라 --radius-*, --card-radius 등 간접)
 *   - `0`, `0px` (모서리 없음)
 *   - `50%`, `100%` (pill)
 *   - `9999px` (pill 대체)
 *   - `inherit`, `initial`
 *
 * 위반:
 *   - raw `border-radius: 6px`, `8px`, `12px` 등. var() 를 거치지 않은 하드코딩
 *
 * 정책: warn only. 위반 수가 baseline보다 증가하면 회귀.
 *
 * 실행:
 *   node scripts/verifyRadiusUsage.mjs
 *   node scripts/verifyRadiusUsage.mjs --json
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')
const SRC_DIR = resolve(ROOT, 'src')
const REPORT_DIR = resolve(ROOT, 'docs/research/ax/reports')

const RADIUS_PROPS = new Set([
  'border-radius',
  'border-top-left-radius',
  'border-top-right-radius',
  'border-bottom-left-radius',
  'border-bottom-right-radius',
  'border-start-start-radius',
  'border-start-end-radius',
  'border-end-start-radius',
  'border-end-end-radius',
])

function walkCss(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (['node_modules', 'dist', 'dist-lib'].includes(name)) continue
      walkCss(p, out)
    } else if (name.endsWith('.css')) out.push(p)
  }
  return out
}

/**
 * border-radius value를 분석하여 violation 여부 판정.
 * value 내 여러 수치(모서리별)가 있을 수 있음 — 각각 검사.
 */
function checkValue(value) {
  const v = value.trim()
  // 허용 키워드
  if (['inherit', 'initial', 'unset', 'revert', 'auto'].includes(v)) return { ok: true }
  // var() 또는 calc() 내부에 var() — var 사용으로 간주
  if (/var\s*\(/.test(v)) return { ok: true }
  // 각 수치 토큰 검사 (공백 분리)
  const tokens = v.split(/\s+/).filter(Boolean)
  /** @type {string[]} */
  const rawNumbers = []
  for (const tok of tokens) {
    // 각 token이 허용 범위인지
    // 0, 0px
    if (tok === '0' || tok === '0px') continue
    // pill (50%, 100%, 9999px)
    if (tok === '50%' || tok === '100%' || tok === '9999px') continue
    // px 리터럴
    if (/^-?\d*\.?\d+px$/.test(tok)) {
      rawNumbers.push(tok)
    }
  }
  return rawNumbers.length > 0 ? { ok: false, rawNumbers } : { ok: true }
}

function scanFile(absPath) {
  const content = readFileSync(absPath, 'utf-8')
  // 블록 주석 제거 — 개행은 보존하여 라인 번호 일관성 유지
  const stripped = content.replace(/\/\*[\s\S]*?\*\//g, (m) => m.replace(/[^\n]/g, ''))
  /** @type {{line: number, prop: string, value: string, raw: string[]}[]} */
  const violations = []
  const lines = stripped.split(/\n/)
  for (let i = 0; i < lines.length; i++) {
    const declRe = /([a-z-]+)\s*:\s*([^;{}]+)(;|$)/gi
    let m
    while ((m = declRe.exec(lines[i])) !== null) {
      const prop = m[1].toLowerCase()
      const value = m[2].trim()
      if (!RADIUS_PROPS.has(prop)) continue
      const c = checkValue(value)
      if (!c.ok) violations.push({ line: i + 1, prop, value, raw: c.rawNumbers })
    }
  }
  return violations
}

function main() {
  const jsonMode = process.argv.includes('--json')
  const files = walkCss(SRC_DIR)
  /** @type {{file: string, violations: any[]}[]} */
  const fileReports = []
  let totalViolations = 0
  for (const f of files) {
    const v = scanFile(f)
    if (v.length > 0) {
      fileReports.push({ file: relative(ROOT, f), violations: v })
      totalViolations += v.length
    }
  }

  if (jsonMode) {
    process.stdout.write(
      JSON.stringify({
        metric: 'radius-usage',
        total_violations: totalViolations,
        files: fileReports.map((fr) => ({
          file: fr.file,
          count: fr.violations.length,
          items: fr.violations.map((v) => ({ line: v.line, prop: v.prop, raw: v.raw })),
        })),
      }),
    )
    process.exit(0)
  }

  const date = new Date().toISOString().slice(0, 10)
  const reportPath = resolve(REPORT_DIR, `radius-usage-${date}.md`)
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true })
  const lines = []
  lines.push(`# Radius Token Usage — ${date}`)
  lines.push('')
  lines.push(`**기준:** border-radius 선언은 \`var(--*)\`, \`0\`, \`50%\`, \`100%\`, \`9999px\` 중 하나.`)
  lines.push(`**결과:** ${totalViolations}건 violation (${fileReports.length} files)`)
  lines.push('')
  for (const fr of fileReports.sort((a, b) => b.violations.length - a.violations.length)) {
    lines.push(`## ${fr.file} (${fr.violations.length})`)
    for (const v of fr.violations) {
      lines.push(`- L${v.line} \`${v.prop}: ${v.value}\` — raw: ${v.raw.join(', ')}`)
    }
    lines.push('')
  }
  writeFileSync(reportPath, lines.join('\n') + '\n')

  console.log(`[radius-usage] violations=${totalViolations} across ${fileReports.length} files`)
  console.log(`[radius-usage] report: ${reportPath}`)
  process.exit(0)
}

try { main() } catch (err) { console.error('[radius-usage] 실패:', err); process.exit(2) }

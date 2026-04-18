#!/usr/bin/env node
// @ts-check
/**
 * verifySpatialGrid — P-03 Spatial Rhythm (Müller-Brockmann baseline grid)
 *
 * 목적: 모든 spatial 속성의 px 값이 4px 배수 (8px 권장)인지 검사.
 *
 * 검사 대상 속성: padding, margin, gap, top/left/right/bottom, inset,
 *   row-gap, column-gap, grid-gap, width, height, min-*, max-* — spatial 수치류
 *   (단 border, outline 등 stroke 속성은 제외)
 *
 * 허용 값:
 *   - `var(--*)`, `calc(...)`, `env(...)`, `clamp(...)` 등 계산식 (해석 복잡도 무시)
 *   - `0`, `100%`, `auto`, `inherit`, `initial`, `100vh`, `100vw`, `100dvh` 등
 *   - `1px`, `2px` (경계 stroke 용도로 허용)
 *   - 4px 배수: 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80, 96, 128...
 *
 * 위반:
 *   - 5px, 7px, 10px, 11px, 13px, 15px 등 비배수
 *   - 0.5rem, 1.5rem 등 소수 rem (16px base일 때 8px 배수지만 여기선 단순 px만 체크)
 *
 * 정책: warn only (exit 0). 수정 의무는 sculpt loop 판단.
 *
 * 실행:
 *   node scripts/verifySpatialGrid.mjs
 *   node scripts/verifySpatialGrid.mjs --json
 */
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')
const SRC_DIR = resolve(ROOT, 'src')
const REPORT_DIR = resolve(ROOT, 'docs/research/ax/reports')

const BASELINE_UNIT = 4 // px

/** spatial 속성 — border/outline 등 stroke는 제외 */
const SPATIAL_PROPS = new Set([
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'padding-block', 'padding-block-start', 'padding-block-end',
  'padding-inline', 'padding-inline-start', 'padding-inline-end',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'margin-block', 'margin-block-start', 'margin-block-end',
  'margin-inline', 'margin-inline-start', 'margin-inline-end',
  'gap', 'row-gap', 'column-gap', 'grid-gap', 'grid-row-gap', 'grid-column-gap',
  'top', 'right', 'bottom', 'left', 'inset',
  'inset-block', 'inset-block-start', 'inset-block-end',
  'inset-inline', 'inset-inline-start', 'inset-inline-end',
])

/** CSS 파일 walk */
function walkCss(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === 'dist' || name === 'dist-lib') continue
      walkCss(p, out)
    } else if (name.endsWith('.css')) {
      out.push(p)
    }
  }
  return out
}

/**
 * 선언 파싱 — 아주 단순한 스캐너.
 * 주석 제거 후 `{ prop: value; }` 패턴을 prop/value 쌍으로 추출.
 * 각 value 내부에서 px 숫자 리터럴을 찾아 4 배수 검사.
 */
function scanFile(absPath) {
  const content = readFileSync(absPath, 'utf-8')
  // /* ... */ 블록 주석 제거
  const stripped = content.replace(/\/\*[\s\S]*?\*\//g, '')
  /** @type {{line: number, prop: string, value: string, px: number, reason: string}[]} */
  const violations = []

  // 라인 단위로 스캔하여 라인 번호 보존
  const lines = stripped.split(/\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    // prop: value; 형태 — 라인 내 여러 prop 가능 (single-line rules)
    const declRe = /([a-z-]+)\s*:\s*([^;{}]+)(;|$)/gi
    let m
    while ((m = declRe.exec(line)) !== null) {
      const prop = m[1].toLowerCase()
      const value = m[2].trim()
      if (!SPATIAL_PROPS.has(prop)) continue
      // value 내 px 숫자 추출
      const pxRe = /(-?\d*\.?\d+)px\b/g
      let pxMatch
      while ((pxMatch = pxRe.exec(value)) !== null) {
        const px = parseFloat(pxMatch[1])
        if (!Number.isFinite(px)) continue
        // 허용: 0, 1, 2 (경계 stroke)
        if (Math.abs(px) <= 2) continue
        // 4 배수 체크
        if (Math.abs(px) % BASELINE_UNIT !== 0) {
          violations.push({
            line: i + 1,
            prop,
            value,
            px,
            reason: `${px}px는 ${BASELINE_UNIT}px 배수 아님`,
          })
        }
      }
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
        metric: 'spatial-grid',
        threshold: { baseline_unit: BASELINE_UNIT },
        total_violations: totalViolations,
        files: fileReports.map((fr) => ({
          file: fr.file,
          count: fr.violations.length,
          items: fr.violations.map((v) => ({ line: v.line, prop: v.prop, px: v.px })),
        })),
      }),
    )
    process.exit(0) // warn only
  }

  const date = new Date().toISOString().slice(0, 10)
  const reportPath = resolve(REPORT_DIR, `spatial-grid-${date}.md`)
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true })
  const lines = []
  lines.push(`# Spatial Grid — ${date}`)
  lines.push('')
  lines.push(`**기준:** spatial 속성의 px 값 ${BASELINE_UNIT}px 배수 (P-03 Müller-Brockmann baseline grid)`)
  lines.push(`**허용:** 0, 1, 2px (경계 stroke), var/calc 계산식`)
  lines.push(`**결과:** ${totalViolations}건 violation (${fileReports.length} files)`)
  lines.push('')
  for (const fr of fileReports.sort((a, b) => b.violations.length - a.violations.length)) {
    lines.push(`## ${fr.file} (${fr.violations.length})`)
    lines.push('')
    for (const v of fr.violations) {
      lines.push(`- L${v.line} \`${v.prop}\`: ${v.px}px — ${v.reason}`)
    }
    lines.push('')
  }
  writeFileSync(reportPath, lines.join('\n') + '\n')

  console.log(`[spatial-grid] violations=${totalViolations} across ${fileReports.length} files`)
  console.log(`[spatial-grid] report: ${reportPath}`)
  process.exit(0)
}

try {
  main()
} catch (err) {
  console.error('[spatial-grid] 실패:', err)
  process.exit(2)
}

#!/usr/bin/env node
// @ts-check
/**
 * verifyLineLength — P-19 Line Length (Bringhurst 45-75ch)
 *
 * 목적: `.w-prose*` 계열 width recipe의 max-width가 45-75ch 범위인지 검사.
 *   문단(prose) 계열만 검증. 일반 width (w-sm/md/lg/xl)는 제외.
 *
 * 기준: 45ch ≤ max-width ≤ 75ch (Bringhurst "Elements of Typographic Style")
 *   - prose-narrow 권장: 50ch
 *   - prose 기준: 65ch (중앙값)
 *   - prose-wide 권장: 75ch
 *
 * 정책: 범위 밖은 warn + violation count. 런타임 prose 사용 부분은 검사 안 함
 *   (토큰/recipe 선언만).
 *
 * 실행:
 *   node scripts/verifyLineLength.mjs
 *   node scripts/verifyLineLength.mjs --json
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')
const AX_CSS = resolve(ROOT, 'src/styles/ax.css')
const REPORT_DIR = resolve(ROOT, 'docs/research/ax/reports')

const MIN_CH = 45
const MAX_CH = 75

/** ax.css에서 .w-prose* 규칙의 max-width ch 값 추출 */
function scanProseRules(css) {
  /** @type {{selector: string, maxWidthCh: number, line: number}[]} */
  const rules = []
  // `.w-prose*  { ... max-width: Nch ... }` 형식 (single-line 선언 위주)
  const lines = css.split(/\n/)
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const sel = line.match(/^(\.w-prose[a-zA-Z-]*)\b/)
    if (!sel) continue
    const mw = line.match(/max-width:\s*(\d+(?:\.\d+)?)ch/)
    if (!mw) continue
    rules.push({ selector: sel[1], maxWidthCh: parseFloat(mw[1]), line: i + 1 })
  }
  return rules
}

function main() {
  const jsonMode = process.argv.includes('--json')
  const css = readFileSync(AX_CSS, 'utf-8')
  const rules = scanProseRules(css)

  const items = rules.map((r) => {
    const inRange = r.maxWidthCh >= MIN_CH && r.maxWidthCh <= MAX_CH
    return { ...r, inRange, reason: inRange ? null : `${r.maxWidthCh}ch ∉ [${MIN_CH}, ${MAX_CH}]` }
  })
  const violations = items.filter((i) => !i.inRange).length

  if (jsonMode) {
    process.stdout.write(
      JSON.stringify({
        metric: 'line-length',
        threshold: { min_ch: MIN_CH, max_ch: MAX_CH },
        total_rules: items.length,
        violations,
        items: items.map((i) => ({
          selector: i.selector,
          max_width_ch: i.maxWidthCh,
          in_range: i.inRange,
        })),
      }),
    )
    process.exit(0)
  }

  const date = new Date().toISOString().slice(0, 10)
  const reportPath = resolve(REPORT_DIR, `line-length-${date}.md`)
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true })
  const lines = []
  lines.push(`# Line Length — ${date}`)
  lines.push('')
  lines.push(`**기준:** prose width recipe의 max-width ∈ [${MIN_CH}ch, ${MAX_CH}ch] (Bringhurst)`)
  lines.push(`**결과:** ${rules.length}개 규칙, ${violations}건 violation`)
  lines.push('')
  lines.push('| selector | max-width | in range? |')
  lines.push('|----------|-----------|:---------:|')
  for (const i of items) {
    lines.push(`| \`${i.selector}\` | ${i.maxWidthCh}ch | ${i.inRange ? '✅' : '❌ ' + i.reason} |`)
  }
  lines.push('')
  if (items.length === 1) {
    lines.push('## 권고')
    lines.push('')
    lines.push('- 현재 `.w-prose` 단일. P2-2 계획대로 `prose-narrow` (50ch) / `prose-wide` (75ch) 추가 시 시각 유연성 확대.')
  }
  writeFileSync(reportPath, lines.join('\n') + '\n')

  console.log(`[line-length] ${rules.length} rules, ${violations} violations`)
  console.log(`[line-length] report: ${reportPath}`)
  process.exit(0)
}

try {
  main()
} catch (err) {
  console.error('[line-length] 실패:', err)
  process.exit(2)
}

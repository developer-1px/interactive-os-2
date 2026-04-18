#!/usr/bin/env node
// @ts-check
/**
 * verifyModularScale — P1-3 (docs/research/ax/04-gap-plan.md §3.3)
 *
 * 목적: Size Ladder (P-02) 검증.
 *   각 계단 인접 비율 r ∈ [1.067, 2.0] 범위 안에 있는지 체크.
 *
 * 정책: 위반 케이스는 **warn만** (exit 0). 비대칭 ladder는 의도된 설계일 수 있음
 *   (Material 3도 typography/shape 이질적). 리포트로 의도 검토를 유도한다.
 *
 * 대상 계단 (tokens.css):
 *   - --space-xs..5xl
 *   - --shape-{2xs..xl}-radius (pill 제외)
 *   - --icon-xs..lg
 *   - --type-{hero,display,page,section,control,body,prose,caption,code}-size
 *
 * 리포트: docs/research/ax/reports/modular-scale-{date}.md
 *
 * 실행: node scripts/verifyModularScale.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..')
const TOKENS_CSS = resolve(ROOT, 'src/styles/tokens.css')
const REPORT_DIR = resolve(ROOT, 'docs/research/ax/reports')

// ════════════════════════════════════════════════════════════
// Config
// ════════════════════════════════════════════════════════════
const RATIO_MIN = 1.067
const RATIO_MAX = 2.0
// 권장 1.25 Major Third — ideal ratio로 표기만, 강제 아님
const IDEAL_RATIO = 1.25

// 각 계단 순서 정의 — tokens.css 선언 순으로 고정
const SCALES = [
  {
    name: 'Space',
    prefix: '--space-',
    order: ['xs', 'sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'],
  },
  {
    name: 'Shape radius',
    prefix: '--shape-',
    suffix: '-radius',
    order: ['2xs', 'xs', 'sm', 'md', 'lg', 'xl'], // pill 제외
  },
  {
    name: 'Icon',
    prefix: '--icon-',
    order: ['xs', 'sm', 'md', 'lg'],
  },
  {
    name: 'Typography',
    prefix: '--type-',
    suffix: '-size',
    // tokens.css 기준 small→large 순 (실제 size로 정렬)
    order: ['code', 'caption', 'control', 'body', 'section', 'prose', 'page', 'display', 'hero'],
  },
]

// ════════════════════════════════════════════════════════════
// §1. CSS 파싱
// ════════════════════════════════════════════════════════════

/** @returns {Map<string, string>} */
function parseRootVars(css) {
  const out = new Map()
  const rootRe = /:root\s*\{([\s\S]*?)\n\}/g
  let m
  while ((m = rootRe.exec(css)) !== null) {
    const body = m[1]
    const varRe = /(--[a-zA-Z0-9_-]+)\s*:\s*([^;]+);/g
    let mv
    while ((mv = varRe.exec(body)) !== null) {
      out.set(mv[1].trim(), mv[2].trim())
    }
  }
  return out
}

/**
 * value (예: '16px', '0.5em', 'var(--radius-seed)', 'calc(var(--radius-seed) * 2)')를
 * px 숫자로 환산. 실패 시 null.
 */
function resolvePx(value, vars, depth = 0) {
  if (depth > 10) return null
  const v = value.trim()

  // 순수 px
  const pxRe = /^(-?\d*\.?\d+)px$/
  const pxMatch = v.match(pxRe)
  if (pxMatch) return parseFloat(pxMatch[1])

  // var(--x)
  const varRe = /^var\(\s*(--[a-zA-Z0-9_-]+)\s*\)\s*$/
  const varMatch = v.match(varRe)
  if (varMatch) {
    const ref = vars.get(varMatch[1])
    if (ref === undefined) return null
    return resolvePx(ref, vars, depth + 1)
  }

  // calc(... * N)
  const calcRe = /^calc\(\s*(.+)\s*\)$/
  const calcMatch = v.match(calcRe)
  if (calcMatch) return evalCalcToPx(calcMatch[1], vars, depth + 1)

  // 순수 숫자 (단위 없음 — 0 등)
  if (/^-?\d*\.?\d+$/.test(v)) return parseFloat(v)

  return null
}

/** 단순 calc 평가 — `var(--x) * 2`, `var(--x) + 4px` 형태만 */
function evalCalcToPx(expr, vars, depth) {
  const tokens = expr.match(/var\(--[a-zA-Z0-9_-]+\)|[-+*/]|[-+]?\d*\.?\d+(?:px)?/g)
  if (!tokens) return null
  let acc = NaN
  let op = '+'
  for (const tRaw of tokens) {
    const t = tRaw.trim()
    if ('+-*/'.includes(t)) {
      op = t
      continue
    }
    let v
    if (t.startsWith('var(')) {
      const m = t.match(/^var\(\s*(--[a-zA-Z0-9_-]+)\s*\)$/)
      if (!m) return null
      const ref = vars.get(m[1])
      v = resolvePx(ref ?? '', vars, depth + 1)
    } else {
      v = resolvePx(t, vars, depth + 1)
    }
    if (v === null || Number.isNaN(v)) return null
    if (Number.isNaN(acc)) {
      acc = v
    } else {
      if (op === '+') acc += v
      else if (op === '-') acc -= v
      else if (op === '*') acc *= v
      else if (op === '/') acc /= v
    }
  }
  return acc
}

// ════════════════════════════════════════════════════════════
// §2. Matrix 구축
// ════════════════════════════════════════════════════════════

function buildScaleRows(scale, vars) {
  const rows = []
  for (const step of scale.order) {
    const varName = `${scale.prefix}${step}${scale.suffix ?? ''}`
    const raw = vars.get(varName)
    const px = raw !== undefined ? resolvePx(raw, vars) : null
    rows.push({ step, varName, raw, px })
  }
  return rows
}

function annotateRatios(rows) {
  for (let i = 0; i < rows.length; i++) {
    const cur = rows[i]
    if (i === 0 || cur.px === null || rows[i - 1].px === null || rows[i - 1].px === 0) {
      cur.ratio = null
      cur.status = 'first'
      continue
    }
    const r = cur.px / rows[i - 1].px
    cur.ratio = r
    if (r < RATIO_MIN) cur.status = 'too_small'
    else if (r > RATIO_MAX) cur.status = 'too_large'
    else if (Math.abs(r - IDEAL_RATIO) <= 0.05) cur.status = 'ideal'
    else if (r >= 1.5) cur.status = 'boundary_high'
    else if (r <= 1.1) cur.status = 'boundary_low'
    else cur.status = 'ok'
  }
  return rows
}

function statusBadge(status) {
  switch (status) {
    case 'first':
      return '—'
    case 'ok':
      return '✅'
    case 'ideal':
      return '✅ 이상적'
    case 'boundary_high':
      return '⚠ 경계 high'
    case 'boundary_low':
      return '⚠ 경계 low'
    case 'too_small':
      return '❌ 너무 작음 (<1.067)'
    case 'too_large':
      return '❌ 너무 큼 (>2.0)'
    default:
      return '?'
  }
}

// ════════════════════════════════════════════════════════════
// §3. Main
// ════════════════════════════════════════════════════════════

function main() {
  const jsonMode = process.argv.includes('--json')
  const tokensCss = readFileSync(TOKENS_CSS, 'utf-8')
  const vars = parseRootVars(tokensCss)

  const scaleResults = SCALES.map((scale) => {
    const rows = annotateRatios(buildScaleRows(scale, vars))
    return { scale, rows }
  })

  let totalWarn = 0
  // warn 집계 선행 (JSON 모드용)
  for (const { rows } of scaleResults) {
    for (const row of rows) {
      if (row.status === 'too_small' || row.status === 'too_large') totalWarn++
      if (row.status === 'boundary_high' || row.status === 'boundary_low') totalWarn++
    }
  }

  if (jsonMode) {
    const payload = {
      metric: 'modular-scale',
      threshold: { ratio_min: RATIO_MIN, ratio_max: RATIO_MAX },
      warnings: totalWarn,
      scales: scaleResults.map(({ scale, rows }) => ({
        name: scale.name,
        steps: rows.map((r) => ({
          step: r.step,
          px: r.px,
          ratio: r.ratio !== null && r.ratio !== undefined ? Number(r.ratio.toFixed(3)) : null,
          status: r.status,
        })),
      })),
    }
    process.stdout.write(JSON.stringify(payload))
    process.exit(0)
  }

  // 리포트
  const date = new Date().toISOString().slice(0, 10)
  const reportPath = resolve(REPORT_DIR, `modular-scale-${date}.md`)
  if (!existsSync(REPORT_DIR)) mkdirSync(REPORT_DIR, { recursive: true })

  // warn 집계는 이미 선행함 — 리포트용 0으로 재집계 방지
  totalWarn = 0
  const lines = []
  lines.push(`# Modular Scale Verification — ${date}`)
  lines.push('')
  lines.push(`**기준:** 각 계단 인접 ratio \`r ∈ [${RATIO_MIN}, ${RATIO_MAX}]\` (P-02 Size Ladder)`)
  lines.push(`**권장:** 1.25 Major Third 기반 ladder (± 0.05)`)
  lines.push('')
  lines.push(
    '**정책:** 범위 밖은 **warn** (exit 0). 비대칭 ladder는 의도된 설계 가능 (Material 3 유사). 리포트로 의도 검토.',
  )
  lines.push('')

  for (const { scale, rows } of scaleResults) {
    lines.push(`## ${scale.name} (${scale.prefix}...${scale.suffix ?? ''})`)
    lines.push('')
    lines.push('| step | value | ratio to prev | status |')
    lines.push('|------|-------|--------------:|--------|')
    for (const row of rows) {
      const v = row.px !== null ? `${row.px}${/size|radius|icon|space/.test(scale.prefix) ? 'px' : ''}` : '—'
      const ratio = row.ratio !== null && row.ratio !== undefined ? row.ratio.toFixed(3) : '—'
      const badge = statusBadge(row.status)
      if (row.status === 'too_small' || row.status === 'too_large') totalWarn++
      if (row.status === 'boundary_high' || row.status === 'boundary_low') totalWarn++
      lines.push(`| ${row.step} | ${v} | ${ratio} | ${badge} |`)
    }
    lines.push('')
  }

  lines.push('## Summary')
  lines.push('')
  lines.push(`- 총 경고 건수: **${totalWarn}**`)
  lines.push('- 범위 밖 (❌) 은 의도 검토 필요, 경계 (⚠) 는 허용 가능')
  lines.push('')

  lines.push('## 권장 (1.25 Major Third 기반)')
  lines.push('')
  lines.push('**Typography 후보:**')
  lines.push('- 12 → 15 → 18.75 → 23.44 → 29.30 → 36.62 (Major Third)')
  lines.push('- 현재 aria: 12 / 14 / 16 / 24 / 32 / 40 — 비단조 ratio (1.167, 1.143, 1.5, 1.333, 1.25)')
  lines.push('')
  lines.push('**Space (baseline 4px/8px):**')
  lines.push('- 4 → 8 → 16 → 24 → 32 → 48 → 64 → 80 → 96')
  lines.push('- 배수 배수지만 ratio = 2.0 (xs→sm), 1.5, 1.33, 1.5, 1.33, 1.25, 1.2 — 상단 완만')
  lines.push('')
  lines.push('**Shape radius:**')
  lines.push('- 2 → 4 → 6 → 8 → 12 → 16 — ratio 2.0, 1.5, 1.33, 1.5, 1.33 — 하단 급격')
  lines.push('')
  lines.push('**Icon:**')
  lines.push('- 14 → 16 → 18 → 24 — ratio 1.143, 1.125, 1.33 — 하단 3단이 RATIO_MIN 경계 근접')
  lines.push('')

  lines.push('---')
  lines.push('')
  lines.push('> 스크립트: `scripts/verifyModularScale.mjs`')
  lines.push('> 참고: `docs/research/ax/04-gap-plan.md` §3.3')

  writeFileSync(reportPath, lines.join('\n') + '\n')

  // 콘솔 출력
  console.log(`[modular-scale] warnings=${totalWarn}`)
  console.log(`[modular-scale] report: ${reportPath}`)
  if (totalWarn > 0) {
    for (const { scale, rows } of scaleResults) {
      const warnRows = rows.filter(
        (r) => r.status === 'too_small' || r.status === 'too_large' || r.status === 'boundary_high' || r.status === 'boundary_low',
      )
      if (warnRows.length === 0) continue
      console.log(`  [${scale.name}]`)
      for (const r of warnRows) {
        console.log(`    - ${r.step} (${r.px}): r=${r.ratio?.toFixed(3)} ${statusBadge(r.status)}`)
      }
    }
  }
  // 정책: warn만이므로 항상 exit 0
  process.exit(0)
}

try {
  main()
} catch (err) {
  console.error('[modular-scale] 검증 실패:', err)
  process.exit(2)
}

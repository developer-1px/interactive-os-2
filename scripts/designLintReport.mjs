#!/usr/bin/env node
/**
 * Design Lint Report — score:design-visual JSON을 LLM-readable 텍스트로 변환
 *
 * Usage: pnpm lint:design
 *   = node scripts/designScoreVisual.mjs | node scripts/designLintReport.mjs
 *
 * Playwright 전 라우트 순회 결과를 토큰 절약형 텍스트로 출력한다.
 * FAIL 규칙만 표시, PASS/SKIP은 생략.
 */
import { readFileSync } from 'node:fs'

const input = readFileSync('/dev/stdin', 'utf-8')
const data = JSON.parse(input)

const lines = []

lines.push(`Design Lint — ${data.summary.routes} routes, score ${data.summary.score}`)
lines.push('')

let totalViolations = 0

for (const [label, route] of Object.entries(data.routes)) {
  if (route.error) {
    lines.push(`[SKIP] ${label}: ${route.error}`)
    continue
  }

  const fails = []
  for (const [rule, result] of Object.entries(route)) {
    if (rule === 'score') continue
    if (result.status === 'FAIL') {
      const viols = result.violations || []
      fails.push({ rule, checked: result.checked, passed: result.passed, violations: viols })
      totalViolations += viols.length
    }
  }

  if (fails.length === 0) continue

  lines.push(`── ${label} (${route.score}) ──`)
  for (const f of fails) {
    lines.push(`  [FAIL] ${f.rule}: ${f.passed}/${f.checked} passed`)
    for (const v of f.violations.slice(0, 3)) {
      const msg = v.message || v.element || JSON.stringify(v)
      lines.push(`    → ${msg}`)
    }
    if (f.violations.length > 3) {
      lines.push(`    ... +${f.violations.length - 3} more`)
    }
  }
  lines.push('')
}

lines.push(`Total: ${totalViolations} violations across ${data.summary.routes} routes`)

console.log(lines.join('\n'))

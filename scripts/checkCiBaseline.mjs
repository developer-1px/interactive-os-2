#!/usr/bin/env node
/**
 * CI baseline ratchet checker.
 *
 * Runs typecheck / lint / test, counts failures, compares to ci-baseline.json.
 * Any count exceeding its baseline → exit 1 (push blocked).
 * Count at/below baseline → exit 0. When all counts strictly decrease, hint to run `pnpm baseline:ci`.
 *
 * Kept independent of installed tools: parses raw stdout. No network, no deps.
 */

import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const baseline = JSON.parse(readFileSync(resolve(root, 'ci-baseline.json'), 'utf8'))

const WHICH = process.argv[2] ?? 'all' // typecheck | lint | test | all

function run(cmd) {
  try {
    return { out: execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }), code: 0 }
  } catch (err) {
    return { out: (err.stdout ?? '') + (err.stderr ?? ''), code: err.status ?? 1 }
  }
}

const checks = {
  typecheck: () => {
    const { out } = run('pnpm -s typecheck')
    const errors = (out.match(/error TS\d+/g) ?? []).length
    return { errors }
  },
  lint: () => {
    const { out } = run('pnpm -s lint')
    const m = out.match(/(\d+)\s+errors?,\s+(\d+)\s+warnings?/i) ?? out.match(/\((\d+)\s+errors?,\s+(\d+)\s+warnings?\)/i)
    if (!m) return { errors: 0, warnings: 0 }
    return { errors: Number(m[1]), warnings: Number(m[2]) }
  },
  test: () => {
    const { out } = run('pnpm -s test')
    const files = out.match(/Test Files\s+(\d+)\s+failed/i)
    const tests = out.match(/Tests\s+(\d+)\s+failed/i)
    const errs = out.match(/^\s*Errors\s+(\d+)\s+errors?/im)
    return {
      failedFiles: files ? Number(files[1]) : 0,
      failedTests: tests ? Number(tests[1]) : 0,
      runtimeErrors: errs ? Number(errs[1]) : 0,
    }
  },
}

const SELECT = WHICH === 'all' ? ['typecheck', 'lint', 'test'] : [WHICH]

let exceeded = false
let improved = false
const report = []

for (const name of SELECT) {
  const current = checks[name]()
  const base = baseline[name]
  const rows = Object.keys(base).map((k) => {
    const cur = current[k] ?? 0
    const exp = base[k]
    const delta = cur - exp
    if (delta > 0) exceeded = true
    if (delta < 0) improved = true
    return { metric: `${name}.${k}`, baseline: exp, current: cur, delta }
  })
  report.push(...rows)
}

const pad = (s, n) => String(s).padEnd(n)
console.log('\nCI baseline ratchet check')
console.log('-'.repeat(64))
console.log(pad('metric', 28), pad('baseline', 10), pad('current', 10), 'delta')
for (const r of report) {
  const mark = r.delta > 0 ? '❌' : r.delta < 0 ? '↓' : '='
  console.log(pad(r.metric, 28), pad(r.baseline, 10), pad(r.current, 10), `${mark} ${r.delta > 0 ? '+' : ''}${r.delta}`)
}
console.log('-'.repeat(64))

if (exceeded) {
  console.error('\n❌ baseline exceeded — fix the regressing metric or revert before pushing.')
  process.exit(1)
}
if (improved) {
  console.log('\n↓ improvement detected — run `pnpm baseline:ci` to lock new baseline.')
}
process.exit(0)

#!/usr/bin/env node
/**
 * Writes ci-baseline.json with current measured counts.
 * Only shrinks — refuses to save if any metric regressed vs existing baseline.
 */

import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const path = resolve(root, 'ci-baseline.json')
const prev = JSON.parse(readFileSync(path, 'utf8'))

function run(cmd) {
  try { return execSync(cmd, { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }) }
  catch (e) { return (e.stdout ?? '') + (e.stderr ?? '') }
}

const tc = (run('pnpm -s typecheck').match(/error TS\d+/g) ?? []).length
const lintOut = run('pnpm -s lint')
const lm = lintOut.match(/(\d+)\s+errors?,\s+(\d+)\s+warnings?/i) ?? lintOut.match(/\((\d+)\s+errors?,\s+(\d+)\s+warnings?\)/i)
const lintE = lm ? Number(lm[1]) : 0, lintW = lm ? Number(lm[2]) : 0
const testOut = run('pnpm -s test')
const tf = testOut.match(/Test Files\s+(\d+)\s+failed/i)
const tt = testOut.match(/Tests\s+(\d+)\s+failed/i)
const te = testOut.match(/^\s*Errors\s+(\d+)\s+errors?/im)

const next = {
  ...prev,
  recordedAt: new Date().toISOString().slice(0, 10),
  lint: { errors: lintE, warnings: lintW },
  typecheck: { errors: tc },
  test: {
    failedFiles: tf ? Number(tf[1]) : 0,
    failedTests: tt ? Number(tt[1]) : 0,
    runtimeErrors: te ? Number(te[1]) : 0,
  },
}

const regressed = []
const compare = (label, a, b) => { if (b > a) regressed.push(`${label}: ${a} → ${b}`) }
compare('lint.errors', prev.lint.errors, next.lint.errors)
compare('lint.warnings', prev.lint.warnings, next.lint.warnings)
compare('typecheck.errors', prev.typecheck.errors, next.typecheck.errors)
compare('test.failedFiles', prev.test.failedFiles, next.test.failedFiles)
compare('test.failedTests', prev.test.failedTests, next.test.failedTests)
compare('test.runtimeErrors', prev.test.runtimeErrors, next.test.runtimeErrors)

if (regressed.length) {
  console.error('❌ refusing to save — regressions:\n  ' + regressed.join('\n  '))
  process.exit(1)
}

writeFileSync(path, JSON.stringify(next, null, 2) + '\n')
console.log('✓ ci-baseline.json updated', next)

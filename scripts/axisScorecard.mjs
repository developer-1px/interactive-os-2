#!/usr/bin/env node
/**
 * Axis coverage scorecard — reads Istanbul coverage-final.json
 * and outputs a JSON scorecard for axis files.
 *
 * Usage: node scripts/axisScorecard.mjs
 */
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const coveragePath = resolve(root, 'coverage/coverage-final.json')

if (!existsSync(coveragePath)) {
  console.error('coverage/coverage-final.json not found. Run vitest with --coverage first.')
  process.exit(1)
}

const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'))

function pct(covered, total) {
  return total === 0 ? 100 : (covered / total) * 100
}

function countCovered(map) {
  let total = 0
  let covered = 0
  for (const counts of Object.values(map)) {
    if (Array.isArray(counts)) {
      total += counts.length
      covered += counts.filter(c => c > 0).length
    } else {
      total += 1
      covered += counts > 0 ? 1 : 0
    }
  }
  return { covered, total }
}

function extractUncoveredBranches(fileCov) {
  const { branchMap, b } = fileCov
  const uncovered = []
  for (const [id, meta] of Object.entries(branchMap)) {
    const hits = b[id]
    if (!hits) continue
    for (let i = 0; i < hits.length; i++) {
      if (hits[i] === 0) {
        uncovered.push({
          branchId: id,
          type: meta.type,
          line: meta.loc?.start?.line ?? meta.locations?.[i]?.start?.line ?? 0,
          side: i === 0 ? 'consequent' : 'alternate',
          hits,
        })
      }
    }
  }
  return uncovered
}

const axes = []

for (const [filePath, fileCov] of Object.entries(coverage)) {
  if (!filePath.includes('/axis/')) continue
  if (filePath.endsWith('types.ts')) continue

  const cleanPath = filePath.split('?')[0]
  const match = cleanPath.match(/\/axis\/(\w+)\.ts$/)
  if (!match) continue

  const name = match[1]
  const Name = name[0].toUpperCase() + name.slice(1)

  const stmtStats = countCovered(fileCov.s)
  const branchStats = countCovered(fileCov.b)
  const fnStats = countCovered(fileCov.f)

  const stmts = pct(stmtStats.covered, stmtStats.total)
  const branches = pct(branchStats.covered, branchStats.total)
  const fns = pct(fnStats.covered, fnStats.total)
  const composite = branches * 0.5 + stmts * 0.3 + fns * 0.2

  const demoExists = existsSync(resolve(root, `src/pages/axis/${Name}Demo.tsx`))
  const testExists = existsSync(
    resolve(root, `src/interactive-os/__tests__/${name}-demo-coverage.integration.test.tsx`),
  )

  const uncovered = extractUncoveredBranches(fileCov)

  let gapType = 'NONE'
  if (!demoExists) gapType = 'MISSING_DEMO'
  else if (!testExists) gapType = 'MISSING_TEST'
  else if (uncovered.length > 0) gapType = 'UNCOVERED_BRANCH'

  axes.push({
    axis: name,
    file: cleanPath,
    stmts: Math.round(stmts * 100) / 100,
    branches: Math.round(branches * 100) / 100,
    fns: Math.round(fns * 100) / 100,
    composite: Math.round(composite * 100) / 100,
    demoExists,
    testExists,
    gapType,
    uncoveredCount: uncovered.length,
    uncovered,
  })
}

axes.sort((a, b) => a.composite - b.composite)

const average =
  axes.length === 0 ? 0 : Math.round((axes.reduce((s, a) => s + a.composite, 0) / axes.length) * 100) / 100

console.log(JSON.stringify({ average, axes }, null, 2))

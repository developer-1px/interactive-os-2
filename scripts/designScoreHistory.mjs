#!/usr/bin/env node
/**
 * Design Score History — 점수 시계열 기록 + diff
 *
 * Usage:
 *   node scripts/designScoreAll.mjs | node scripts/designScoreHistory.mjs          # 기록
 *   node scripts/designScoreHistory.mjs --diff                                      # 최근 2회 비교
 *   node scripts/designScoreHistory.mjs --actionable                                # 점수 올리기 가장 쉬운 항목 순위
 *
 * 기록 파일: .design-score-history.json (gitignored)
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs'

const HISTORY_PATH = '.design-score-history.json'

function loadHistory() {
  if (!existsSync(HISTORY_PATH)) return []
  try { return JSON.parse(readFileSync(HISTORY_PATH, 'utf-8')) } catch { return [] }
}

function saveHistory(history) {
  writeFileSync(HISTORY_PATH, JSON.stringify(history, null, 2))
}

const args = process.argv.slice(2)

if (args.includes('--diff')) {
  const history = loadHistory()
  if (history.length < 2) { console.log('Need at least 2 records for diff.'); process.exit(0) }
  const prev = history[history.length - 2]
  const curr = history[history.length - 1]
  console.log(`Score diff: ${prev.summary.score} → ${curr.summary.score}`)
  console.log(`  Lint:    ${prev.summary.lintScore} → ${curr.summary.lintScore}`)
  console.log(`  Metrics: ${prev.summary.metricsScore} → ${curr.summary.metricsScore}`)
  console.log('')
  // Per-route diff
  for (const path of Object.keys(curr.routes)) {
    const c = curr.routes[path]
    const p = prev.routes?.[path]
    if (!p || p.error || c.error) continue
    const delta = c.score - p.score
    if (Math.abs(delta) >= 0.005) {
      const arrow = delta > 0 ? '↑' : '↓'
      console.log(`  ${path}: ${(p.score * 100).toFixed(1)}% → ${(c.score * 100).toFixed(1)}% ${arrow}${(Math.abs(delta) * 100).toFixed(1)}`)
    }
  }
  process.exit(0)
}

if (args.includes('--actionable')) {
  const history = loadHistory()
  if (history.length === 0) { console.log('No history. Run score:design-all first.'); process.exit(0) }
  const curr = history[history.length - 1]
  // Find routes with worst lint and metrics scores
  const routeEntries = Object.entries(curr.routes)
    .filter(([, d]) => !d.error)
    .map(([path, d]) => ({ path, score: d.score, lint: d.lint, metrics: d.metrics }))
    .sort((a, b) => a.score - b.score)

  console.log('=== Actionable: worst routes first ===')
  console.log('')
  for (const r of routeEntries.slice(0, 10)) {
    const lintScore = r.lint?.score ?? 'n/a'
    const metScore = r.metrics?.score ?? 'n/a'
    console.log(`${(r.score * 100).toFixed(1)}% ${r.path}  (lint ${lintScore}, metrics ${metScore})`)
  }
  console.log('')

  // Find most common lint violations across all routes
  // We don't have per-violation data in summary, but we can show passed/total rules
  console.log('Tip: run `pnpm score:design-all --text` to see per-route breakdown')
  process.exit(0)
}

// Default: record from stdin
let input = ''
try { input = readFileSync('/dev/stdin', 'utf-8') } catch { console.error('Pipe score:design-all output to this script.'); process.exit(1) }

const data = JSON.parse(input)
data.timestamp = new Date().toISOString()

const history = loadHistory()
history.push(data)
// Keep last 50 records
if (history.length > 50) history.splice(0, history.length - 50)
saveHistory(history)

console.log(`Recorded: ${data.summary.score} (${data.summary.routes} routes) at ${data.timestamp}`)
if (history.length >= 2) {
  const prev = history[history.length - 2]
  console.log(`Previous: ${prev.summary.score}`)
  const curr = parseFloat(data.summary.score)
  const prevN = parseFloat(prev.summary.score)
  const delta = curr - prevN
  console.log(`Delta:    ${delta >= 0 ? '+' : ''}${delta.toFixed(1)}%`)
}

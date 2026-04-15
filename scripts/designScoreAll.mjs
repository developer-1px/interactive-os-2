#!/usr/bin/env node
/**
 * Design Score All — lint rules + structural metrics → unified score per route
 *
 * Usage:
 *   node scripts/designScoreAll.mjs                    # all routes
 *   node scripts/designScoreAll.mjs /ui/listbox        # specific route
 *   node scripts/designScoreAll.mjs ui                 # substring match
 *   node scripts/designScoreAll.mjs --text             # LLM-readable text output
 *
 * Requires: dev server running at localhost:5173
 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'
import { runDesignLint } from './designLintRules.mjs'
import { runDesignMetrics } from './designMetrics.mjs'

const baseUrl = process.env.BASE_URL || 'http://localhost:5173'

const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

const routes = [
  // App pages
  { path: '/viewer', label: 'Viewer' },
  { path: '/book', label: 'Book' },
  { path: '/chat', label: 'Chat' },
  { path: '/writer', label: 'Writer' },
  { path: '/incident', label: 'Incident' },
  { path: '/replay', label: 'Replay' },
  { path: '/i18n', label: 'I18n Editor' },
  { path: '/creator', label: 'Creator' },
  // UI showcase
  { path: '/ui/navlist', label: 'UI: NavList' },
  { path: '/ui/tab-list', label: 'UI: TabList' },
  { path: '/ui/menu-list', label: 'UI: MenuList' },
  { path: '/ui/toolbar', label: 'UI: Toolbar' },
  { path: '/ui/accordion', label: 'UI: Accordion' },
  { path: '/ui/disclosure-group', label: 'UI: DisclosureGroup' },
  { path: '/ui/listbox', label: 'UI: ListBox' },
  { path: '/ui/combobox', label: 'UI: Combobox' },
  { path: '/ui/radio-group', label: 'UI: RadioGroup' },
  { path: '/ui/checkbox', label: 'UI: Checkbox' },
  { path: '/ui/switch-group', label: 'UI: SwitchGroup' },
  { path: '/ui/toggle', label: 'UI: Toggle' },
  { path: '/ui/toggle-group', label: 'UI: ToggleGroup' },
  { path: '/ui/tree-grid', label: 'UI: TreeGrid' },
  { path: '/ui/grid', label: 'UI: Grid' },
  { path: '/ui/tree-view', label: 'UI: TreeView' },
  { path: '/ui/kanban', label: 'UI: Kanban' },
  { path: '/ui/slider', label: 'UI: Slider' },
  { path: '/ui/spinbutton', label: 'UI: Spinbutton' },
  { path: '/ui/dialog', label: 'UI: Dialog' },
  { path: '/ui/alert-dialog', label: 'UI: AlertDialog' },
  { path: '/ui/toaster', label: 'UI: Toaster' },
  { path: '/ui/tooltip', label: 'UI: Tooltip' },
  // Internals
  { path: '/internals/theme', label: 'Theme' },
]

/* ── CLI args ── */

const rawArgs = process.argv.slice(2)
const textMode = rawArgs.includes('--text')
const filters = rawArgs.filter(a => a !== '--text')

function filterRoutes(allRoutes, f) {
  if (f.length === 0) return allRoutes
  return allRoutes.filter(r =>
    f.some(q => {
      if (q.startsWith('/')) return r.path === q
      return r.path.toLowerCase().includes(q.toLowerCase()) || r.label.toLowerCase().includes(q.toLowerCase())
    })
  )
}

/* ── Score calculation ── */

/**
 * Weights: lint error=3, lint warning=1, metric=2
 * Each item scores 0-1. Route score = weighted average.
 */
function computeRouteScore(lintResult, metricsResult) {
  let weightSum = 0
  let scoreSum = 0

  // Lint rules — derive severity from violations
  const errorRules = new Set()
  for (const v of lintResult.violations) {
    if (v.severity === 'error') errorRules.add(v.rule)
  }

  for (const [id, r] of Object.entries(lintResult.ruleResults)) {
    if (r.checked === 0) continue
    const ruleScore = r.passed / r.checked
    const weight = errorRules.has(id) ? 3 : 1
    // Rules with no violations could be error or warning — treat as warning (weight 1)
    // unless they appear in violations as error
    // If passed === checked and no violations, it's passing fully so weight doesn't matter much
    // but for consistency, check if *any* violation for this rule was error-severity
    scoreSum += weight * ruleScore
    weightSum += weight
  }

  // Metrics (visual-complexity is P2 stub, weight 0)
  const METRIC_WEIGHTS = {
    'alignment-score': 3,
    'whitespace-fraction': 2,
    'proportion-constraint': 3,
    'spacing-rhythm': 2,
    'visual-complexity': 0,
  }
  if (metricsResult?.metrics) {
    for (const [id, m] of Object.entries(metricsResult.metrics)) {
      const w = METRIC_WEIGHTS[id] ?? 2
      if (w === 0) continue
      scoreSum += w * (m.normalized ?? 0)
      weightSum += w
    }
  }

  return weightSum > 0 ? scoreSum / weightSum : 0
}

/* ── Main ── */

async function main() {
  const execPath = process.env.CHROME_PATH || chromePaths.find(p => existsSync(p))
  if (!execPath) {
    console.error('Chrome not found. Set CHROME_PATH env var.')
    process.exit(1)
  }

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: execPath,
    args: ['--no-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900 })

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle0', timeout: 10000 })
  } catch {
    console.error(`Failed to connect to ${baseUrl} — is the dev server running?`)
    await browser.close()
    process.exit(1)
  }

  const targetRoutes = filterRoutes(routes, filters)
  if (targetRoutes.length === 0) {
    console.error(`No routes matched: ${filters.join(', ')}`)
    console.error(`Available: ${routes.map(r => r.path).join(', ')}`)
    await browser.close()
    process.exit(1)
  }

  const output = { routes: {}, summary: { routes: 0, score: '0%', lintScore: '0%', metricsScore: '0%' } }
  const allLintScores = []
  const allMetricsScores = []
  const allRouteScores = []

  for (const route of targetRoutes) {
    try {
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle0', timeout: 10000 })
      await new Promise(r => setTimeout(r, 300))
    } catch {
      output.routes[route.path] = { error: `Failed to load ${route.path}` }
      continue
    }

    // Run both lint and metrics via page.evaluate (serialized via .toString())
    const lintResult = await page.evaluate(runDesignLint)
    const metricsResult = await page.evaluate(runDesignMetrics)

    // Compute sub-scores for summary breakdown
    let lintWeightSum = 0, lintScoreSum = 0
    const errorRules = new Set()
    for (const v of lintResult.violations) {
      if (v.severity === 'error') errorRules.add(v.rule)
    }
    for (const [id, r] of Object.entries(lintResult.ruleResults)) {
      if (r.checked === 0) continue
      const w = errorRules.has(id) ? 3 : 1
      lintScoreSum += w * (r.passed / r.checked)
      lintWeightSum += w
    }
    const routeLintScore = lintWeightSum > 0 ? lintScoreSum / lintWeightSum : 1

    let metricsWeightSum = 0, metricsScoreSum = 0
    const MW = { 'alignment-score': 3, 'whitespace-fraction': 2, 'proportion-constraint': 3, 'spacing-rhythm': 2, 'visual-complexity': 0 }
    if (metricsResult?.metrics) {
      for (const [id, m] of Object.entries(metricsResult.metrics)) {
        const w = MW[id] ?? 2
        if (w === 0) continue
        metricsScoreSum += w * (m.normalized ?? 0)
        metricsWeightSum += w
      }
    }
    const routeMetricsScore = metricsWeightSum > 0 ? metricsScoreSum / metricsWeightSum : 1

    const routeScore = computeRouteScore(lintResult, metricsResult)

    allLintScores.push(routeLintScore)
    allMetricsScores.push(routeMetricsScore)
    allRouteScores.push(routeScore)

    output.routes[route.path] = {
      lint: lintResult.summary,
      metrics: metricsResult?.summary ?? { score: 0 },
      score: Math.round(routeScore * 1000) / 1000,
    }
  }

  const avg = arr => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0
  output.summary = {
    routes: allRouteScores.length,
    score: `${(avg(allRouteScores) * 100).toFixed(1)}%`,
    lintScore: `${(avg(allLintScores) * 100).toFixed(1)}%`,
    metricsScore: `${(avg(allMetricsScores) * 100).toFixed(1)}%`,
  }

  await browser.close()

  if (textMode) {
    console.log(formatText(output))
  } else {
    console.log(JSON.stringify(output, null, 2))
  }
}

function formatText(output) {
  const lines = []
  lines.push(`Design Score: ${output.summary.score} (${output.summary.routes} routes)`)
  lines.push(`  Lint: ${output.summary.lintScore}  Metrics: ${output.summary.metricsScore}`)
  lines.push('')
  for (const [path, data] of Object.entries(output.routes)) {
    if (data.error) {
      lines.push(`${path}: ERROR — ${data.error}`)
      continue
    }
    const score = (data.score * 100).toFixed(1)
    const lintInfo = data.lint?.score ?? 'n/a'
    lines.push(`${path}: ${score}% (lint ${lintInfo}, metrics ${data.metrics?.score ?? 'n/a'})`)
  }
  return lines.join('\n')
}

main().catch(e => {
  console.error(e.message)
  process.exit(1)
})

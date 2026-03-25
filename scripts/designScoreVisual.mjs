#!/usr/bin/env node
/**
 * Design Score Visual — 렌더링 후 미감 규칙 측정 (Playwright runner)
 *
 * Usage: node scripts/designScoreVisual.mjs
 * Requires: dev server running at localhost:5173
 *
 * 규칙은 designLintRules.mjs에서 가져온다 (단일 소스).
 * 이 파일은 Playwright로 전 라우트를 순회하며 JSON을 출력하는 runner.
 */
import puppeteer from 'puppeteer-core'
import { existsSync, readFileSync } from 'node:fs'
import { runDesignLint } from './designLintRules.mjs'

const baseUrl = process.env.BASE_URL || 'http://localhost:5173'

const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

const routes = [
  { path: '/', label: 'CMS' },
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
  { path: '/internals/theme', label: 'Theme' },
]

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

  const output = { routes: {}, summary: { total: 0, pass: 0 } }

  for (const route of routes) {
    try {
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle0', timeout: 10000 })
      await new Promise(r => setTimeout(r, 300))
    } catch {
      output.routes[route.label] = { error: `Failed to load ${route.path}` }
      continue
    }

    // page.evaluate serializes runDesignLint via .toString() — it's self-contained
    const result = await page.evaluate(runDesignLint)

    const { summary, violations, ruleResults } = result

    // Per-rule breakdown for CI output
    const ruleBreakdown = {}
    for (const [name, r] of Object.entries(ruleResults)) {
      if (r.checked === 0) {
        ruleBreakdown[name] = { status: 'SKIP', reason: 'no applicable elements' }
      } else {
        const pass = r.passed === r.checked
        ruleBreakdown[name] = {
          status: pass ? 'PASS' : 'FAIL',
          checked: r.checked,
          passed: r.passed,
        }
        if (!pass) {
          ruleBreakdown[name].violations = violations
            .filter(v => v.rule === name)
            .slice(0, 5)
            .map(v => ({ element: v.element, message: v.message }))
        }
      }
    }

    output.routes[route.label] = {
      ...ruleBreakdown,
      score: summary.score,
    }

    output.summary.total += summary.totalRules
    output.summary.pass += summary.passedRules
  }

  output.summary.routes = `${Object.keys(output.routes).length}/${routes.length}`
  output.summary.score = output.summary.total > 0
    ? `${((output.summary.pass / output.summary.total) * 100).toFixed(1)}%`
    : '0%'

  await browser.close()

  console.log(JSON.stringify(output, null, 2))
}

main().catch(e => {
  console.error(e.message)
  process.exit(1)
})

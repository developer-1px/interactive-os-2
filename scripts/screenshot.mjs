#!/usr/bin/env node
/**
 * Screenshot — 라우트별 스크린샷 캡처
 *
 * Usage:
 *   node scripts/screenshot.mjs                     # 전 라우트
 *   node scripts/screenshot.mjs /docs               # 특정 라우트
 *   node scripts/screenshot.mjs /ui/listbox /ui/grid # 여러 라우트
 *   node scripts/screenshot.mjs ui                   # "ui" 포함 라우트만
 *
 * Output: screenshots/ 디렉토리에 PNG 저장
 * Requires: dev server running at localhost:5173
 */
import puppeteer from 'puppeteer-core'
import { existsSync, mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const baseUrl = process.env.BASE_URL || 'http://localhost:5173'
const outDir = resolve(process.cwd(), 'screenshots')

const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

const routes = [
  { path: '/', label: 'cms' },
  { path: '/docs', label: 'docs' },
  { path: '/viewer', label: 'viewer' },
  { path: '/ui/navlist', label: 'ui-navlist' },
  { path: '/ui/tab-list', label: 'ui-tab-list' },
  { path: '/ui/menu-list', label: 'ui-menu-list' },
  { path: '/ui/toolbar', label: 'ui-toolbar' },
  { path: '/ui/accordion', label: 'ui-accordion' },
  { path: '/ui/disclosure-group', label: 'ui-disclosure-group' },
  { path: '/ui/listbox', label: 'ui-listbox' },
  { path: '/ui/combobox', label: 'ui-combobox' },
  { path: '/ui/radio-group', label: 'ui-radio-group' },
  { path: '/ui/checkbox', label: 'ui-checkbox' },
  { path: '/ui/switch-group', label: 'ui-switch-group' },
  { path: '/ui/toggle', label: 'ui-toggle' },
  { path: '/ui/toggle-group', label: 'ui-toggle-group' },
  { path: '/ui/tree-grid', label: 'ui-tree-grid' },
  { path: '/ui/grid', label: 'ui-grid' },
  { path: '/ui/tree-view', label: 'ui-tree-view' },
  { path: '/ui/kanban', label: 'ui-kanban' },
  { path: '/ui/slider', label: 'ui-slider' },
  { path: '/ui/spinbutton', label: 'ui-spinbutton' },
  { path: '/ui/dialog', label: 'ui-dialog' },
  { path: '/ui/alert-dialog', label: 'ui-alert-dialog' },
  { path: '/ui/toaster', label: 'ui-toaster' },
  { path: '/ui/tooltip', label: 'ui-tooltip' },
  { path: '/internals/theme', label: 'theme' },
  { path: '/incident', label: 'incident' },
]

/* ── Options parsing ── */

const rawArgs = process.argv.slice(2)
const theme = rawArgs.find(a => a === '--light') ? 'light' : rawArgs.find(a => a === '--dark') ? 'dark' : null
const wait = (() => { const i = rawArgs.indexOf('--wait'); return i >= 0 ? Number(rawArgs[i + 1]) : 500 })()
const args = rawArgs.filter(a => !a.startsWith('--') && !(rawArgs[rawArgs.indexOf('--wait') + 1] === a))

function filterRoutes(allRoutes, filters) {
  if (filters.length === 0) return allRoutes
  const matched = []
  for (const f of filters) {
    const found = allRoutes.filter(r =>
      f.startsWith('/') ? r.path === f
        : r.path.toLowerCase().includes(f.toLowerCase()) || r.label.toLowerCase().includes(f.toLowerCase())
    )
    if (found.length > 0) {
      matched.push(...found)
    } else if (f.startsWith('/')) {
      // 등록 안 된 경로도 직접 찍기
      matched.push({ path: f, label: f.slice(1).replace(/\//g, '-') || 'root' })
    }
  }
  return matched
}

/* ── Main ── */

async function main() {
  const execPath = process.env.CHROME_PATH || chromePaths.find(p => existsSync(p))
  if (!execPath) {
    console.error('Chrome not found. Set CHROME_PATH env var.')
    process.exit(1)
  }

  mkdirSync(outDir, { recursive: true })

  const browser = await puppeteer.launch({
    headless: true,
    executablePath: execPath,
    args: ['--no-sandbox'],
  })

  const page = await browser.newPage()
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 })

  try {
    await page.goto(`${baseUrl}/`, { waitUntil: 'networkidle0', timeout: 10000 })
  } catch {
    console.error(`Failed to connect to ${baseUrl} — is the dev server running?`)
    await browser.close()
    process.exit(1)
  }

  const targetRoutes = filterRoutes(routes, args)
  if (targetRoutes.length === 0) {
    console.error(`No routes matched: ${args.join(', ')}`)
    console.error(`Available: ${routes.map(r => r.path).join(', ')}`)
    await browser.close()
    process.exit(1)
  }

  const captured = []

  for (const route of targetRoutes) {
    try {
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle0', timeout: 10000 })
      if (theme) await page.evaluate(t => document.documentElement.setAttribute('data-theme', t), theme)
      await new Promise(r => setTimeout(r, wait))
    } catch {
      console.error(`✗ ${route.label} — failed to load`)
      continue
    }

    const suffix = theme ? `-${theme}` : ''
    const filePath = resolve(outDir, `${route.label}${suffix}.png`)
    await page.screenshot({ path: filePath, fullPage: false })
    captured.push({ label: route.label, path: filePath })
    console.log(`✓ ${route.label} → ${filePath}`)
  }

  await browser.close()

  console.log(`\n${captured.length}/${targetRoutes.length} screenshots saved to ${outDir}/`)
}

main().catch(e => {
  console.error(e.message)
  process.exit(1)
})

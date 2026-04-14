#!/usr/bin/env node
/**
 * XRay — 라우트의 FlatLayout + 컴포넌트 구조를 stdout에 덤프
 *
 * Usage:
 *   node scripts/xray.mjs /cms
 *   node scripts/xray.mjs /ui/listbox --json
 *   node scripts/xray.mjs / --wait 800
 *
 * Output: stdout (sans GUI). Reads window.__ARIA_ENGINES__ from DEV build.
 * Requires: dev server running at localhost:5173
 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const baseUrl = process.env.BASE_URL || 'http://localhost:5173'

const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

const rawArgs = process.argv.slice(2)
const asJson = rawArgs.includes('--json')
const waitIdx = rawArgs.indexOf('--wait')
const wait = waitIdx >= 0 ? Number(rawArgs[waitIdx + 1]) : 500
const waitValue = waitIdx >= 0 ? rawArgs[waitIdx + 1] : null
const positional = rawArgs.filter(a => !a.startsWith('--') && a !== waitValue)
const route = positional[0] || '/'

const AXIS_KEYS = [
  'type', 'widget', 'label', 'surface', 'role', 'padding', 'gap',
  'direction', 'layout', 'placement', 'size', 'sticky', 'scroll',
  'columns', 'rows', 'span', 'align', 'justify',
]

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
  await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 1 })

  const pageErrors = []
  page.on('pageerror', e => pageErrors.push(e.message))
  page.on('console', msg => {
    if (msg.type() === 'error') pageErrors.push(msg.text())
  })

  try {
    await page.goto(`${baseUrl}${route}`, { waitUntil: 'networkidle0', timeout: 15000 })
  } catch {
    console.error(`Failed to load ${baseUrl}${route} — is dev server running?`)
    await browser.close()
    process.exit(1)
  }

  await new Promise(r => setTimeout(r, wait))

  const snapshot = await page.evaluate((axisKeys) => {
    const raw = window.__ARIA_ENGINES__
    if (!raw) return { error: '__ARIA_ENGINES__ not found — is this a DEV build?' }

    const engines = raw instanceof Map ? Array.from(raw.entries()) : Object.entries(raw)
    if (engines.length === 0) return { error: 'No engines registered on this page.' }

    function pickAxes(data) {
      if (!data || typeof data !== 'object') return {}
      const out = {}
      for (const k of axisKeys) {
        if (data[k] !== undefined && data[k] !== null && data[k] !== '') out[k] = data[k]
      }
      return out
    }

    function readAxFromDom(el) {
      if (!el || !el.className || typeof el.className !== 'string') return {}
      const prefixMap = {
        sf: 'surface', rl: 'role', pd: 'padding', ly: 'layout', g: 'gap',
        ct: 'content', tx: 'text', ia: 'interactive', pl: 'placement',
        ts: 'textStyle', tn: 'tone', wt: 'weight', st: 'state', op: 'opacity',
        mo: 'motion', bd: 'border', sc: 'scroll', fx: 'flex', cl: 'clamp',
        ic: 'icon', sq: 'square', ar: 'aspect',
      }
      const axes = {}
      for (const cls of el.className.split(/\s+/)) {
        const m = cls.match(/^([a-z]{1,3})-(.+)$/)
        if (!m) continue
        const axis = prefixMap[m[1]]
        if (axis) axes[axis] = m[2]
      }
      return axes
    }

    function walk(store, nodeId, depth, engineActions) {
      const entity = store.entities?.[nodeId]
      const data = entity?.data ?? {}
      const axes = pickAxes(data)
      if (!entity) axes.type = axes.type || 'root'

      // Overlay DOM ax() classes (when FlatLayout data is sparse)
      let domAxes = {}
      if (engineActions?.getNodeElement) {
        const el = engineActions.getNodeElement(nodeId)
        if (el) domAxes = readAxFromDom(el)
      }

      const children = (store.relationships?.[nodeId] ?? [])
        .map(cid => walk(store, cid, depth + 1, engineActions))
        .filter(Boolean)

      return { id: nodeId, depth, axes, domAxes, children }
    }

    const result = []
    for (const [id, actions] of engines) {
      let store
      try { store = actions.getStore() } catch (e) { result.push({ id, error: String(e) }); continue }
      const rootKids = store.relationships?.['__root__'] ?? []
      const entityCount = Object.keys(store.entities ?? {}).filter(k => !k.startsWith('__')).length
      if (rootKids.length === 0 && entityCount === 0) {
        result.push({ id, roots: [], empty: true })
        continue
      }
      const roots = rootKids.map(rid => walk(store, rid, 0, actions)).filter(Boolean)
      result.push({ id, roots })
    }
    return { engines: result }
  }, AXIS_KEYS)

  await browser.close()

  if (snapshot.error) {
    console.error(snapshot.error)
    if (pageErrors.length) console.error('Page errors:\n' + pageErrors.join('\n'))
    process.exit(1)
  }

  if (asJson) {
    console.log(JSON.stringify(snapshot, null, 2))
    return
  }

  console.log(`# xray ${route}`)
  for (const engine of snapshot.engines) {
    if (engine.empty) continue
    console.log(`\n[engine: ${engine.id}]`)
    if (engine.error) { console.log(`  ERROR ${engine.error}`); continue }
    for (const root of engine.roots) printNode(root)
  }
  if (pageErrors.length) {
    console.log('\n# page errors')
    for (const e of pageErrors) console.log('  ' + e)
  }
}

function printNode(node) {
  const indent = '  '.repeat(node.depth + 1)
  const axes = { ...node.domAxes, ...node.axes }
  const type = axes.type || 'item'
  const widget = axes.widget ? `(${axes.widget})` : ''
  const label = axes.label && axes.label !== axes.widget ? ` "${axes.label}"` : ''
  const parts = []
  for (const k of ['surface', 'role', 'padding', 'gap', 'direction', 'layout', 'placement', 'columns', 'rows']) {
    if (axes[k] !== undefined) parts.push(`${k}=${axes[k]}`)
  }
  const meta = parts.length ? ' ' + parts.join(' ') : ''
  console.log(`${indent}${type}${widget}${label}${meta}  #${node.id}`)
  for (const child of node.children) printNode(child)
}

main().catch(e => {
  console.error(e.stack || e.message)
  process.exit(1)
})

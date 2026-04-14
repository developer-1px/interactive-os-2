#!/usr/bin/env node
/**
 * XRay v2 — 라우트의 FlatLayout + ARIA + ax() 진실을 stdout에 덤프
 *
 * Usage:
 *   node scripts/xray.mjs /cms
 *   node scripts/xray.mjs /ui/listbox --json
 *   node scripts/xray.mjs / --wait 800 --verbose
 *
 * Flags:
 *   --json      raw 트리 (압축 전) JSON 출력
 *   --verbose   반복 압축 비활성화 (평탄 출력)
 *   --wait N    라우트 로드 후 대기 ms (default 500)
 *
 * 읽는 값: window.__ARIA_ENGINES__ (DEV 빌드) + DOM ax() 클래스 + ARIA 속성
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
const verbose = rawArgs.includes('--verbose')
const waitIdx = rawArgs.indexOf('--wait')
const wait = waitIdx >= 0 ? Number(rawArgs[waitIdx + 1]) : 500
const waitValue = waitIdx >= 0 ? rawArgs[waitIdx + 1] : null
const positional = rawArgs.filter(a => !a.startsWith('--') && a !== waitValue)
const route = positional[0] || '/'

// node.data에서 읽을 ax()/layout 축 키
const AXIS_KEYS = [
  'type', 'widget', 'label', 'surface', 'role', 'padding', 'gap',
  'direction', 'layout', 'placement', 'size', 'sticky', 'scroll',
  'columns', 'rows', 'span', 'align', 'justify', 'interactive',
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

    // ax() 클래스 prefix → 축 이름
    const AX_PREFIX = {
      sf: 'surface', rl: 'role', pd: 'padding', ly: 'layout', g: 'gap',
      ct: 'content', tx: 'text', ia: 'interactive', pl: 'placement',
      ts: 'textStyle', tn: 'tone', wt: 'weight', st: 'state', op: 'opacity',
      mo: 'motion', bd: 'border', sc: 'scroll', fx: 'flex', cl: 'clamp',
      ic: 'icon', sq: 'square', ar: 'aspect', dr: 'direction', al: 'align',
      ju: 'justify',
    }

    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'textbox', 'combobox', 'listbox', 'option',
      'menuitem', 'menuitemcheckbox', 'menuitemradio', 'tab', 'checkbox',
      'radio', 'switch', 'treeitem', 'gridcell', 'slider', 'spinbutton',
    ])
    const INTERACTIVE_TAGS = new Set(['BUTTON', 'A', 'INPUT', 'SELECT', 'TEXTAREA'])

    function pickDeclaredAxes(data) {
      if (!data || typeof data !== 'object') return {}
      const out = {}
      for (const k of axisKeys) {
        if (data[k] !== undefined && data[k] !== null && data[k] !== '') out[k] = data[k]
      }
      return out
    }

    function readAxFromDom(el) {
      if (!el || typeof el.className !== 'string') return {}
      const axes = {}
      for (const cls of el.className.split(/\s+/)) {
        const m = cls.match(/^([a-z]{1,3})-(.+)$/)
        if (!m) continue
        const axis = AX_PREFIX[m[1]]
        if (axis) axes[axis] = m[2]
      }
      return axes
    }

    function readAriaState(el) {
      if (!el) return null
      const state = {}
      const role = el.getAttribute('role')
      if (role) state.role = role
      const label = el.getAttribute('aria-label')
      if (label) state.label = label
      if (el.getAttribute('aria-selected') === 'true') state.selected = true
      const exp = el.getAttribute('aria-expanded')
      if (exp === 'true') state.expanded = true
      else if (exp === 'false') state.expanded = false
      if (el.getAttribute('aria-checked') === 'true') state.checked = true
      if (el.getAttribute('aria-disabled') === 'true') state.disabled = true
      if (el.hasAttribute('disabled')) state.disabled = true
      const cur = el.getAttribute('aria-current')
      if (cur && cur !== 'false') state.current = cur
      const lvl = el.getAttribute('aria-level')
      if (lvl) state.level = lvl
      if (document.activeElement === el) state.focused = true
      return state
    }

    function isInteractive(el, declaredAxes) {
      if (declaredAxes.interactive) return true
      if (!el) return false
      if (INTERACTIVE_TAGS.has(el.tagName)) return true
      const ti = el.getAttribute('tabindex')
      if (ti !== null && Number(ti) >= 0) return true
      const role = el.getAttribute('role')
      if (role && INTERACTIVE_ROLES.has(role)) return true
      return false
    }

    function walk(store, nodeId, depth, engineActions) {
      const entity = store.entities?.[nodeId]
      const data = entity?.data ?? {}
      const declared = pickDeclaredAxes(data)

      let el = null
      let domAxes = {}
      let aria = null
      if (engineActions?.getNodeElement) {
        try { el = engineActions.getNodeElement(nodeId) } catch { el = null }
        if (el) {
          domAxes = readAxFromDom(el)
          aria = readAriaState(el)
        }
      }

      // surface 진실 3단:
      //   declared → 그대로
      //   DOM sf-* → surfaceInherited + '*'
      //   둘 다 없음 → '—'
      const surfaceDeclared = declared.surface
      const surfaceDom = domAxes.surface
      let surfaceDisplay
      if (surfaceDeclared !== undefined) surfaceDisplay = String(surfaceDeclared)
      else if (surfaceDom !== undefined) surfaceDisplay = String(surfaceDom) + '*'
      else surfaceDisplay = '—'

      const interactive = isInteractive(el, declared)

      const children = (store.relationships?.[nodeId] ?? [])
        .map(cid => walk(store, cid, depth + 1, engineActions))
        .filter(Boolean)

      return {
        id: nodeId,
        depth,
        declared,
        domAxes,
        surfaceDisplay,
        aria,
        interactive,
        children,
      }
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

  // 전역 인터랙티브 카운터 — 렌더 순서대로 번호 부여
  const counter = { n: 0 }

  // 2-pass: (1) 인터랙티브 번호 부여 pre-order, (2) 렌더
  function numberInteractive(node) {
    if (node.interactive) {
      counter.n += 1
      node.num = counter.n
    }
    for (const c of node.children) numberInteractive(c)
  }

  console.log(`# xray ${route}`)
  for (const engine of snapshot.engines) {
    if (engine.empty) continue
    console.log(`\n[engine: ${engine.id}]`)
    if (engine.error) { console.log(`  ERROR ${engine.error}`); continue }
    for (const root of engine.roots) numberInteractive(root)
    // Engine root siblings도 동일 압축
    printSiblings(engine.roots, verbose)
  }
  if (pageErrors.length) {
    console.log('\n# page errors')
    for (const e of pageErrors) console.log('  ' + e)
  }
}

// 시그니처 해시 (라벨 제외): type|widget|surfaceDeclared|role|interactive|axesJson
function sigOf(node) {
  const d = node.declared
  const axesForSig = {}
  for (const k of ['padding', 'gap', 'direction', 'layout', 'placement', 'columns', 'rows', 'align', 'justify']) {
    if (d[k] !== undefined) axesForSig[k] = d[k]
  }
  const role = (node.aria && node.aria.role) || d.role || ''
  return [
    d.type || '',
    d.widget || '',
    d.surface === undefined ? '' : String(d.surface),
    role,
    node.interactive ? '1' : '0',
    JSON.stringify(axesForSig),
  ].join('|')
}

function formatLine(node) {
  const d = node.declared
  const type = d.type || (d.widget ? 'widget' : 'node')
  const widget = d.widget ? `(${d.widget})` : ''
  const labelText = (node.aria && node.aria.label) || d.label
  const label = labelText ? ` "${labelText}"` : ''

  const axParts = [`surface=${node.surfaceDisplay}`]
  for (const k of ['padding', 'gap', 'direction', 'layout', 'placement', 'columns', 'rows', 'align', 'justify']) {
    if (d[k] !== undefined) axParts.push(`${k}=${d[k]}`)
  }
  const ax = ` [ax: ${axParts.join(' ')}]`

  const a = node.aria || {}
  const stateParts = []
  if (a.role) stateParts.push(`role=${a.role}`)
  if (a.selected) stateParts.push('selected')
  if (a.expanded === true) stateParts.push('expanded')
  else if (a.expanded === false) stateParts.push('expanded=false')
  if (a.checked) stateParts.push('checked')
  if (a.disabled) stateParts.push('disabled')
  if (a.focused) stateParts.push('focused')
  if (a.current) stateParts.push(`current=${a.current}`)
  if (a.level) stateParts.push(`level=${a.level}`)
  const aria = stateParts.length ? ` [${stateParts.join(' ')}]` : ''

  const num = node.num ? `[${node.num}] ` : ''
  return `${num}${type}${widget}${label}${ax}${aria}  #${node.id}`
}

function printNode(node, verboseMode) {
  const indent = '  '.repeat(node.depth + 1)
  console.log(indent + formatLine(node))
  printSiblings(node.children, verboseMode)
}

function printSiblings(list, verboseMode) {
  if (verboseMode) {
    for (const c of list) printNode(c, verboseMode)
    return
  }
  let i = 0
  while (i < list.length) {
    const first = list[i]
    const sig = sigOf(first)
    let j = i + 1
    while (j < list.length && sigOf(list[j]) === sig) j += 1
    const runLen = j - i
    printNode(first, verboseMode)
    if (runLen > 1) {
      const rest = list.slice(i + 1, j)
      const childIndent = '  '.repeat(first.depth + 1)
      const nums = rest.map(r => r.num).filter(Boolean)
      const numRange = nums.length ? `[${nums[0]}..${nums[nums.length - 1]}] ` : ''
      const d = first.declared
      const type = d.type || (d.widget ? 'widget' : 'node')
      const role = (first.aria && first.aria.role) || d.role
      const roleTag = role ? ` [role=${role}]` : ''
      console.log(`${childIndent}${numRange}${type} ×${runLen - 1} similar${roleTag}  … (compressed)`)
    }
    i = j
  }
}

main().catch(e => {
  console.error(e.stack || e.message)
  process.exit(1)
})

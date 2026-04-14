#!/usr/bin/env node
/**
 * XRay v3 — 라우트의 FlatLayout + ARIA + ax() + 소스 좌표를 stdout에 덤프
 *
 * 지도로서의 도구: "화면의 X를 고쳐줘" → 소스 파일 도달 시간 단축
 *
 * Usage:
 *   node scripts/xray.mjs /cms
 *   node scripts/xray.mjs / --find "Get Started"
 *   node scripts/xray.mjs / --bbox --wait 800
 *
 * Flags:
 *   --json          raw 트리 JSON 출력 (소스/텍스트/bbox 포함)
 *   --verbose       반복 압축 비활성화
 *   --compact       v2 호환: source/text off
 *   --bbox          노드 getBoundingClientRect 포함
 *   --find "text"   label/aria-label/innerText 매칭 경로만 출력
 *   --wait N        라우트 로드 후 대기 ms (default 500)
 *
 * 소스 좌표: React 19 fiber._debugStack (Error) 를 파싱하여 /src/ 첫 프레임 추출.
 * Requires: Vite DEV 빌드. prod에서는 _debugStack 없음.
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
const compact = rawArgs.includes('--compact')
const showBbox = rawArgs.includes('--bbox')
const waitIdx = rawArgs.indexOf('--wait')
const wait = waitIdx >= 0 ? Number(rawArgs[waitIdx + 1]) : 500
const waitValue = waitIdx >= 0 ? rawArgs[waitIdx + 1] : null
const findIdx = rawArgs.indexOf('--find')
const findQuery = findIdx >= 0 ? rawArgs[findIdx + 1] : null
const findValue = findIdx >= 0 ? rawArgs[findIdx + 1] : null
const positional = rawArgs.filter(a => !a.startsWith('--') && a !== waitValue && a !== findValue)
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

  const snapshot = await page.evaluate((axisKeys, opts) => {
    const { wantSource, wantText, wantBbox } = opts
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

    // _debugStack → 모든 project-local /src/ 프레임 수집
    function extractFramesFromStack(stackErr) {
      if (!stackErr || !stackErr.stack) return []
      const lines = String(stackErr.stack).split('\n')
      const frames = []
      for (const line of lines) {
        // match URL with /src/ up to :line:col, strip query ?t=... before digits
        const m = line.match(/(https?:\/\/[^\s)]+?\/src\/[^\s)?]+)(?:\?[^\s):]*)?:(\d+):(\d+)/)
        if (!m) continue
        const pathMatch = m[1].match(/\/src\/.+$/)
        if (!pathMatch) continue
        frames.push({ file: pathMatch[0].replace(/^\//, ''), line: Number(m[2]), col: Number(m[3]) })
      }
      return frames
    }

    function getFiber(el) {
      if (!el) return null
      const key = Object.keys(el).find(k => k.startsWith('__reactFiber$'))
      return key ? el[key] : null
    }

    // FlatLayout/primitive 파일은 "엔진 내부" — widget 노드는 그 바깥 프레임을 원함
    // widget 노드는 ui/primitives/pattern 등 엔진 구현부가 아닌 호출 사이트를 원함
    const ENGINE_PATH_RE = /interactive-os\/(ui|primitives|pattern|axis|engine|store)\//

    function framesOfFiber(fiber) {
      const out = []
      if (!fiber) return out
      out.push(...extractFramesFromStack(fiber._debugStack))
      // _debugOwner 체인의 스택도 후보로 사용 (일부 fiber는 _debugStack이 없음)
      const owner = fiber._debugOwner
      if (owner && owner !== fiber) out.push(...extractFramesFromStack(owner._debugStack))
      return out
    }

    function pickNonEngineFrame(frames) {
      return frames.find(f => !ENGINE_PATH_RE.test(f.file)) || null
    }

    // widget 노드는 FlatLayout이 <Component .../>로 렌더하므로
    // container div fiber 밑으로 내려가며 진짜 widget 함수 컴포넌트를 찾고,
    // 그 함수 내부에서 생성된 child fiber의 _debugStack(= 함수 내부 JSX 위치)을 쓴다.
    // fiber 자체의 _debugStack은 "누가 <Component/>를 썼나"(=FlatLayout/PageCms)라 부정확.
    function findWidgetInnerSource(rootFiber, widgetName) {
      // 함수 컴포넌트 fiber들을 수집 (깊이 제한). 각 fiber의 첫 child에서 non-engine frame을 찾는다.
      const fnFibers = []
      const stack = [{ fiber: rootFiber, depth: 0 }]
      while (stack.length) {
        const { fiber, depth } = stack.pop()
        if (!fiber || depth > 12) continue
        if (typeof fiber.type === 'function') fnFibers.push(fiber)
        if (fiber.child) stack.push({ fiber: fiber.child, depth: depth + 1 })
        // sibling도 얕게 (같은 깊이에서 여러 child 처리)
        if (fiber.sibling && depth > 0) stack.push({ fiber: fiber.sibling, depth })
      }

      let bestByName = null
      let bestFirst = null
      for (const fnF of fnFibers) {
        const n = fnF.type.name || fnF.type.displayName || ''
        // 이 함수 컴포넌트의 child fiber들을 얕게 훑어 첫 non-engine frame 획득
        let ch = fnF.child
        let guard = 0
        let picked = null
        while (ch && guard < 30) {
          const frames = framesOfFiber(ch)
          const ne = pickNonEngineFrame(frames)
          if (ne) { picked = ne; break }
          ch = ch.sibling || ch.child
          guard++
        }
        if (!picked) continue
        const stripped = n.replace(/Widget$/, '')
        const matches = widgetName && (n === widgetName || stripped === widgetName || n.includes(widgetName) || widgetName.includes(stripped))
        const entry = { frame: picked, owner: n }
        if (matches && !bestByName) bestByName = entry
        if (!bestFirst) bestFirst = entry
      }
      return bestByName || bestFirst
    }

    function readSource(el, isWidget, widgetName) {
      const fiber = getFiber(el)
      if (!fiber) return null

      if (isWidget) {
        const hit = findWidgetInnerSource(fiber, widgetName)
        if (hit) {
          return { ...hit.frame, owner: hit.owner, resolved: true }
        }
        // fallback: 기존 return-chain 로직 + '?' 표시
      }

      // 일반(비 widget) 또는 widget fallback: return 체인에서 non-engine frame
      let cur = fiber
      let hops = 0
      const collected = []
      while (cur && hops < 25) {
        const fs = extractFramesFromStack(cur._debugStack)
        for (const f of fs) collected.push(f)
        cur = cur.return
        hops++
      }
      if (collected.length === 0) return null
      const picked = (isWidget ? pickNonEngineFrame(collected) : null) || collected[0]
      // owner 컴포넌트명 힌트
      let owner = fiber
      let ownerName = null
      let h2 = 0
      while (owner && h2 < 20) {
        if (typeof owner.type === 'function') {
          const n = owner.type.name || owner.type.displayName
          if (n && !/^(FlatLayout|AriaRoute|Outlet|RenderedRoute|RenderErrorBoundary|SplitPane|PassThrough)$/.test(n)) {
            ownerName = n
            break
          }
        }
        owner = owner.return
        h2++
      }
      return { ...picked, owner: ownerName, resolved: !isWidget }
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
      let source = null
      let text = null
      let bbox = null
      if (engineActions?.getNodeElement) {
        try { el = engineActions.getNodeElement(nodeId) } catch { el = null }
        if (el) {
          domAxes = readAxFromDom(el)
          aria = readAriaState(el)
          if (wantSource) source = readSource(el, !!declared.widget, declared.widget || null)
          if (wantBbox) {
            try {
              const r = el.getBoundingClientRect()
              if (r.width > 0 || r.height > 0) {
                bbox = { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }
              }
            } catch { /* noop */ }
          }
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

      if (wantText && el && interactive) {
        const raw = (el.innerText || el.textContent || '').trim().replace(/\s+/g, ' ')
        if (raw) text = raw.length > 40 ? raw.slice(0, 40) + '…' : raw
      }

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
        source,
        text,
        bbox,
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
  }, AXIS_KEYS, { wantSource: !compact, wantText: !compact, wantBbox: showBbox })

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

  // --find: mark matches & prune tree to ancestor paths
  if (findQuery) {
    const q = findQuery.toLowerCase()
    const markMatch = (node) => {
      const label = (node.aria && node.aria.label) || node.declared.label || ''
      const hay = `${label} ${node.text || ''}`.toLowerCase()
      const self = hay.includes(q)
      let anyChild = false
      for (const c of node.children) if (markMatch(c)) anyChild = true
      node.__match = self
      node.__onPath = self || anyChild
      if (!node.__onPath) node.children = []
      else node.children = node.children.filter(c => c.__onPath)
      return node.__onPath
    }
    for (const eng of snapshot.engines) {
      if (!eng.roots) continue
      eng.roots = eng.roots.filter(r => markMatch(r))
    }
  }

  console.log(`# xray ${route}${findQuery ? ` --find "${findQuery}"` : ''}`)
  if (!compact) console.log('# source: Fiber._debugStack (Vite DEV). compact=off')
  for (const engine of snapshot.engines) {
    if (engine.empty) continue
    if (findQuery && (!engine.roots || engine.roots.length === 0)) continue
    console.log(`\n[engine: ${engine.id}]`)
    if (engine.error) { console.log(`  ERROR ${engine.error}`); continue }
    for (const root of engine.roots) numberInteractive(root)
    printSiblings(engine.roots, verbose)
  }

  // Orphan scan placeholder — TODO: scan FlatLayout 바깥 ax() 클래스 요소
  // v3에선 미구현. find/bbox/source가 먼저 검증된 후 별도 PR.
  console.log('\n# orphan candidates (TODO)')
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
  const text = node.text ? ` text="${node.text}"` : ''
  const bbox = node.bbox ? ` @[${node.bbox.x},${node.bbox.y} ${node.bbox.w}×${node.bbox.h}]` : ''
  let src = ''
  if (node.source) {
    const owner = node.source.owner ? `${node.source.owner} ` : ''
    const mark = node.source.resolved === false ? '?' : ''
    src = `  → ${owner}${node.source.file}:${node.source.line}${mark}`
  }
  const mark = node.__match ? '✦ ' : ''
  return `${mark}${num}${type}${widget}${label}${text}${ax}${aria}  #${node.id}${bbox}${src}`
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

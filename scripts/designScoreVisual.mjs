#!/usr/bin/env node
/**
 * Design Score Visual — 렌더링 후 미감 규칙 측정
 *
 * Usage: node scripts/designScoreVisual.mjs
 * Requires: dev server running at localhost:5173
 *
 * Puppeteer로 전 라우트를 headless 순회하며 4개 런타임 규칙을 측정한다:
 *   V1: 정렬 축 수 — 고유 x/y 좌표 수 (좋은 디자인 ≤ threshold ratio)
 *   V2: 시각 노이즈 — 요소당 동시 장식 속성 수 (≤ threshold)
 *   V3: ARIA 기본 시각 효과 — role별 상태(selected/focused/expanded) 시각 변화 유무
 *   V4: 콘텐츠-경계 간격 — 텍스트와 부모 경계 사이 padding > 0
 */
import puppeteer from 'puppeteer-core'
import { existsSync } from 'node:fs'

const baseUrl = process.env.BASE_URL || 'http://localhost:5173'
const ALIGNMENT_RATIO_THRESHOLD = 0.4
const VISUAL_NOISE_THRESHOLD = 2

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

/* ── All measurements run in a single page.evaluate() ── */

function measureAll(noiseThreshold) {
  function isVisible(el) {
    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }

  // Shell selector for excluding nav/sidebar from alignment measurement
  const SHELL_SELECTOR = 'nav, header, [role="navigation"], [role="banner"], [class*="sidebar"], [class*="Sidebar"], [class*="activityBar"], [class*="ActivityBar"]'

  /* V1: Alignment Axis Count */
  const GRID = 8
  const xCoords = new Set()
  let v1ElementCount = 0
  const v1Els = document.querySelectorAll('[role], button, a, input, select, textarea, label, span, p, h1, h2, h3, h4, h5, h6, li, td, th, img, svg')

  for (const el of v1Els) {
    if (el.closest(SHELL_SELECTOR)) continue
    if (!isVisible(el)) continue
    const rect = el.getBoundingClientRect()
    // Layout wrappers are not meaningful alignment targets
    if (rect.width > 800 && rect.height > 600) continue
    v1ElementCount++
    xCoords.add(Math.round(rect.left / GRID) * GRID)
  }

  const v1Ratio = v1ElementCount > 0 ? xCoords.size / v1ElementCount : 0
  const v1 = {
    uniqueAxes: xCoords.size,
    elementCount: v1ElementCount,
    ratio: Math.round(v1Ratio * 1000) / 1000,
    axes: [...xCoords],  // raw axes for cross-page consistency check
  }

  /* V2: Visual Noise Count */
  // outline은 포커스 인디케이터이므로 장식에서 제외
  const DECORATION_PROPS = [
    { prop: 'borderWidth', none: ['0px', '0px 0px 0px 0px'] },
    { prop: 'boxShadow', none: ['none', ''] },
    { prop: 'backgroundColor', none: ['rgba(0, 0, 0, 0)', 'transparent', ''] },
  ]

  const v2Elements = document.querySelectorAll('[role], button, a, input, select, textarea, [class]')
  const v2Violations = []
  let v2TotalChecked = 0
  let v2TotalPass = 0

  for (const el of v2Elements) {
    if (!isVisible(el)) continue
    // Switch thumb/track requires layered decoration by design
    if (el.closest('[role="switch"]')) continue
    // Surface cards (data-surface) intentionally layer border+shadow+bg
    if (el.hasAttribute('data-surface') || el.closest('[data-surface]')) continue
    const rect = el.getBoundingClientRect()

    let decorationCount = 0
    const activeDecorations = []
    const style = getComputedStyle(el)

    for (const { prop, none } of DECORATION_PROPS) {
      const value = style[prop]
      if (value && !none.includes(value)) {
        decorationCount++
        activeDecorations.push(`${prop}=${value}`)
      }
    }

    // Stacked decorations via wrapping divs
    let parent = el.parentElement
    let depth = 0
    while (parent && depth < 2) {
      const parentRect = parent.getBoundingClientRect()
      const isWrapper = parentRect.width - rect.width < 32 && parentRect.height - rect.height < 32
      if (isWrapper) {
        const parentStyle = getComputedStyle(parent)
        for (const { prop, none } of DECORATION_PROPS) {
          const value = parentStyle[prop]
          if (value && !none.includes(value)) {
            decorationCount++
            activeDecorations.push(`parent.${prop}=${value}`)
          }
        }
      }
      parent = parent.parentElement
      depth++
    }

    if (decorationCount > 0) {
      v2TotalChecked++
      if (decorationCount <= noiseThreshold) {
        v2TotalPass++
      } else {
        const label = el.getAttribute('role') || el.tagName.toLowerCase()
        const text = (el.textContent || '').trim().slice(0, 25)
        v2Violations.push({
          element: `${label}${text ? ` "${text}"` : ''}`,
          count: decorationCount,
          decorations: activeDecorations,
        })
      }
    }
  }

  const v2 = { totalChecked: v2TotalChecked, totalPass: v2TotalPass, violations: v2Violations }

  /* V3: ARIA Visual Effect */
  const ARIA_VISUAL_CHECKS = [
    { attr: 'aria-selected', value: 'true' },
    { attr: 'aria-expanded', value: 'true' },
    { attr: 'aria-checked', value: 'true' },
    { attr: 'aria-current', value: 'true' },
  ]

  let v3TotalChecked = 0
  let v3TotalPass = 0
  const v3Violations = []

  for (const check of ARIA_VISUAL_CHECKS) {
    const activeEls = document.querySelectorAll(`[${check.attr}="${check.value}"]`)
    const inactiveEls = document.querySelectorAll(`[${check.attr}="false"]`)
    if (activeEls.length === 0 || inactiveEls.length === 0) continue

    for (const activeEl of activeEls) {
      if (!isVisible(activeEl)) continue
      const role = activeEl.getAttribute('role')
      if (!role) continue

      let inactiveEl = null
      for (const el of inactiveEls) {
        if (el.getAttribute('role') === role && isVisible(el)) {
          inactiveEl = el
          break
        }
      }
      if (!inactiveEl) continue

      v3TotalChecked++

      const activeStyle = getComputedStyle(activeEl)
      const inactiveStyle = getComputedStyle(inactiveEl)

      const changed =
        activeStyle.backgroundColor !== inactiveStyle.backgroundColor ||
        activeStyle.color !== inactiveStyle.color ||
        activeStyle.fontWeight !== inactiveStyle.fontWeight ||
        activeStyle.outline !== inactiveStyle.outline ||
        activeStyle.borderColor !== inactiveStyle.borderColor ||
        activeStyle.opacity !== inactiveStyle.opacity ||
        activeStyle.textDecoration !== inactiveStyle.textDecoration

      if (changed) {
        v3TotalPass++
      } else {
        const label = (activeEl.textContent || '').trim().slice(0, 25)
        v3Violations.push({ attr: check.attr, role, element: label || role })
      }

      break
    }
  }

  const v3 = { totalChecked: v3TotalChecked, totalPass: v3TotalPass, violations: v3Violations }

  /* V4: Content-Border Gap */
  const v4Candidates = document.querySelectorAll('[role="option"], [role="tab"], [role="menuitem"], [role="treeitem"], [role="row"], [role="button"], [role="radio"], [role="switch"], button, a[href]')

  let v4TotalChecked = 0
  let v4TotalPass = 0
  const v4Violations = []

  for (const el of v4Candidates) {
    if (!isVisible(el)) continue

    const style = getComputedStyle(el)
    const hasBg = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent'
    const hasBorder = style.borderWidth !== '0px' && style.borderStyle !== 'none'
    if (!hasBg && !hasBorder) continue

    const paddingTop = parseFloat(style.paddingTop)
    const paddingRight = parseFloat(style.paddingRight)
    const paddingBottom = parseFloat(style.paddingBottom)
    const paddingLeft = parseFloat(style.paddingLeft)

    v4TotalChecked++

    // Icon-only elements (SVG child, no real text) don't need padding
    // Icon-only elements or wrapper elements (child has its own padding) are exempt
    const hasOnlySvg = el.querySelector('svg') && !([...el.childNodes].some(n =>
      n.nodeType === 3 && n.textContent.trim().length > 0
    ))
    if (hasOnlySvg) {
      v4TotalPass++
      continue
    }
    // Wrapper check: if first child has padding, the parent is a layout container
    const firstChild = el.children[0]
    if (firstChild && el.children.length <= 2) {
      const childStyle = getComputedStyle(firstChild)
      if (parseFloat(childStyle.paddingLeft) > 0 && parseFloat(childStyle.paddingTop) > 0) {
        v4TotalPass++
        continue
      }
    }
    const hasDirectText = el.textContent && el.textContent.trim().length > 0
    if (!hasDirectText) {
      v4TotalPass++
      continue
    }

    const minHPadding = Math.min(paddingLeft, paddingRight)
    const minVPadding = Math.min(paddingTop, paddingBottom)

    if (minHPadding > 0 && minVPadding >= 0) {
      v4TotalPass++
    } else {
      const role = el.getAttribute('role') || el.tagName.toLowerCase()
      const text = el.textContent.trim().slice(0, 25)
      v4Violations.push({
        element: `${role} "${text}"`,
        padding: `${paddingTop}/${paddingRight}/${paddingBottom}/${paddingLeft}`,
      })
    }
  }

  const v4 = { totalChecked: v4TotalChecked, totalPass: v4TotalPass, violations: v4Violations }

  return { v1, v2, v3, v4 }
}

/* ── Output formatting ── */

function formatMetric(result, opts) {
  if (opts.skipIf && opts.skipIf(result)) return { status: 'SKIP', ...(opts.skipReason && { reason: opts.skipReason }) }
  const pass = opts.isPass(result)
  return {
    ...opts.data(result),
    status: pass ? 'PASS' : 'FAIL',
    ...(! pass && opts.details && { details: opts.details(result) }),
  }
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

  const output = { routes: {}, summary: { total: 0, pass: 0 } }
  const allAxesSets = []  // collect per-route axes for cross-page consistency

  for (const route of routes) {
    try {
      await page.goto(`${baseUrl}${route.path}`, { waitUntil: 'networkidle0', timeout: 10000 })
      await new Promise(r => setTimeout(r, 300))
    } catch {
      output.routes[route.label] = { error: `Failed to load ${route.path}` }
      continue
    }

    const { v1, v2, v3, v4 } = await page.evaluate(measureAll, VISUAL_NOISE_THRESHOLD)

    if (v1.axes.length > 0) allAxesSets.push({ label: route.label, axes: new Set(v1.axes) })

    const checks = []

    if (v1.elementCount >= 10) checks.push({ name: 'alignmentAxes', pass: v1.ratio <= ALIGNMENT_RATIO_THRESHOLD })
    if (v2.totalChecked > 0) checks.push({ name: 'visualNoise', pass: v2.violations.length === 0 })
    if (v3.totalChecked > 0) checks.push({ name: 'ariaVisualEffect', pass: v3.violations.length === 0 })
    if (v4.totalChecked > 0) checks.push({ name: 'contentBorderGap', pass: v4.violations.length === 0 })

    const routePass = checks.filter(c => c.pass).length

    output.routes[route.label] = {
      alignmentAxes: formatMetric(v1, {
        skipIf: r => r.elementCount < 10,
        skipReason: 'too few elements',
        isPass: r => r.ratio <= ALIGNMENT_RATIO_THRESHOLD,
        data: r => ({ uniqueAxes: r.uniqueAxes, elements: r.elementCount, ratio: r.ratio }),
      }),
      visualNoise: formatMetric(v2, {
        skipIf: r => r.totalChecked === 0,
        isPass: r => r.violations.length === 0,
        data: r => ({ checked: r.totalChecked, pass: r.totalPass, violations: r.violations.length }),
        details: r => r.violations.slice(0, 5),
      }),
      ariaVisualEffect: formatMetric(v3, {
        skipIf: r => r.totalChecked === 0,
        isPass: r => r.violations.length === 0,
        data: r => ({ checked: r.totalChecked, pass: r.totalPass }),
        details: r => r.violations,
      }),
      contentBorderGap: formatMetric(v4, {
        skipIf: r => r.totalChecked === 0,
        isPass: r => r.violations.length === 0,
        data: r => ({ checked: r.totalChecked, pass: r.totalPass }),
        details: r => r.violations.slice(0, 5),
      }),
      score: `${routePass}/${checks.length}`,
    }

    output.summary.total += checks.length
    output.summary.pass += routePass
  }

  output.summary.routes = `${Object.keys(output.routes).length}/${routes.length}`
  output.summary.score = output.summary.total > 0
    ? `${((output.summary.pass / output.summary.total) * 100).toFixed(1)}%`
    : '0%'

  // Cross-page grid consistency: how much do pages share the same alignment axes?
  if (allAxesSets.length >= 2) {
    const union = new Set()
    for (const { axes } of allAxesSets) for (const a of axes) union.add(a)

    // Intersection: axes that appear in ALL pages
    const intersection = new Set([...union].filter(a => allAxesSets.every(s => s.axes.has(a))))

    // Average overlap between pairs (Jaccard-like)
    let pairOverlapSum = 0
    let pairCount = 0
    for (let i = 0; i < allAxesSets.length; i++) {
      for (let j = i + 1; j < allAxesSets.length; j++) {
        const shared = [...allAxesSets[i].axes].filter(a => allAxesSets[j].axes.has(a)).length
        const unionSize = new Set([...allAxesSets[i].axes, ...allAxesSets[j].axes]).size
        if (unionSize > 0) {
          pairOverlapSum += shared / unionSize
          pairCount++
        }
      }
    }

    output.summary.gridConsistency = {
      unionAxes: union.size,
      intersectionAxes: intersection.size,
      sharedAxes: [...intersection].sort((a, b) => a - b),
      avgPairOverlap: pairCount > 0 ? `${(pairOverlapSum / pairCount * 100).toFixed(1)}%` : '0%',
      pages: allAxesSets.length,
    }
  }

  await browser.close()

  console.log(JSON.stringify(output, null, 2))
}

main().catch(e => {
  console.error(e.message)
  process.exit(1)
})

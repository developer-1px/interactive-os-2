#!/usr/bin/env node
// ② 2026-03-25-design-score-prd.md
/**
 * Design Score — 디자인 시스템 누락 감지 스크립트
 *
 * Usage: node scripts/designScore.mjs
 * Requires: dev server running at localhost:5173
 *
 * Opens /internals/theme in headless Chrome, checks 6 design rules
 * against all showcase components, outputs JSON score matrix.
 */
import puppeteer from 'puppeteer-core'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'

const baseUrl = process.env.BASE_URL || 'http://localhost:5173'

const chromePaths = [
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
]

/* ── R6: CSS token usage (static analysis) ── */

const DESIGN_PROPS = new Set([
  'color', 'background', 'background-color',
  'border', 'border-color', 'border-top', 'border-right', 'border-bottom', 'border-left',
  'border-width', 'border-top-width', 'border-right-width', 'border-bottom-width', 'border-left-width',
  'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left',
  'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left',
  'gap', 'row-gap', 'column-gap',
  'font-size', 'font-weight', 'font-family', 'line-height',
  'border-radius', 'border-top-left-radius', 'border-top-right-radius',
  'border-bottom-left-radius', 'border-bottom-right-radius',
  'box-shadow', 'outline', 'outline-color', 'outline-width', 'outline-offset',
  'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height',
])

const EXEMPT_VALUES = new Set([
  '0', '0px', '0%', 'none', 'inherit', 'initial', 'unset', 'revert',
  'transparent', 'currentColor', 'currentcolor',
  'auto', 'normal', '100%', '50%',
])

const EXEMPT_PATTERNS = [
  /^var\(--/,           // token usage
  /^calc\(.+var\(--/,   // calc with token inside
  /^-?\d+px\s/,         // shorthand — check individual values
]

function isExemptValue(value) {
  const trimmed = value.trim()
  if (EXEMPT_VALUES.has(trimmed)) return true
  if (/^var\(--/.test(trimmed)) return true
  if (/^calc\(/.test(trimmed) && /var\(--/.test(trimmed)) return true
  // Pure numbers that are unitless (like line-height: 1.4, font-weight: 500, flex: 1)
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return true
  // 1px border-width is universal and has no token — exempt
  if (trimmed === '1px') return true
  // Percentages with no design meaning
  if (/^-?\d+(\.\d+)?%$/.test(trimmed) && (trimmed === '100%' || trimmed === '50%')) return true
  return false
}

function parseShorthand(value) {
  // Split shorthand values like "6px 12px" or "1px solid var(--border)"
  // but not inside var() or calc()
  const parts = []
  let depth = 0
  let current = ''
  for (const ch of value) {
    if (ch === '(') depth++
    if (ch === ')') depth--
    if (ch === ' ' && depth === 0) {
      if (current.trim()) parts.push(current.trim())
      current = ''
    } else {
      current += ch
    }
  }
  if (current.trim()) parts.push(current.trim())
  return parts
}

function checkCssTokenUsage(dir) {
  const results = {}
  const files = readdirSync(dir).filter(f => f.endsWith('.module.css'))

  for (const file of files) {
    const content = readFileSync(join(dir, file), 'utf-8')
    const componentName = file.replace('.module.css', '')
    let totalDesignValues = 0
    let tokenizedValues = 0
    const violations = []

    // Parse CSS declarations
    const declRegex = /^\s*([\w-]+)\s*:\s*(.+?)\s*;/gm
    let match
    while ((match = declRegex.exec(content)) !== null) {
      const prop = match[1]
      const rawValue = match[2].trim()

      if (!DESIGN_PROPS.has(prop)) continue

      // Split shorthand into individual values
      const parts = parseShorthand(rawValue)
      for (const part of parts) {
        // Skip CSS keywords that aren't design values
        if (['solid', 'dashed', 'dotted', 'double', 'groove', 'ridge', 'inset', 'outset'].includes(part)) continue
        if (['thin', 'medium', 'thick'].includes(part)) continue

        totalDesignValues++
        if (isExemptValue(part)) {
          tokenizedValues++
        } else {
          violations.push({ prop, value: part, line: content.slice(0, match.index).split('\n').length })
        }
      }
    }

    results[componentName] = {
      total: totalDesignValues,
      tokenized: tokenizedValues,
      violations,
      pass: violations.length === 0,
    }
  }

  return results
}

/* ── R1–R5: Runtime DOM checks ── */

const INTERACTIVE_ROLES = ['button', 'tab', 'option', 'menuitem', 'radio', 'switch']

async function checkRuntime(page) {
  return await page.evaluate((roles) => {
    const results = {}

    // Find the showcase grid
    const allDivs = document.querySelectorAll('div[class]')
    let grid = null
    for (const el of allDivs) {
      if (typeof el.className === 'string' && el.className.includes('grid') && el.children.length >= 10) {
        grid = el
        break
      }
    }
    if (!grid) return { error: 'Showcase grid not found' }

    // Card name mapping (by order in PageThemeCreator)
    const cardNames = [
      'Kanban', 'Preferences', 'DataView', 'Explorer',
      'Hierarchy', 'InputGroup', 'Sidebar', 'Actions',
      'Confirm', 'Menu',
    ]

    // R1: data-surface check per card
    const cards = Array.from(grid.children)
    for (let i = 0; i < cards.length; i++) {
      const name = cardNames[i] || `Card${i}`
      const card = cards[i]
      results[name] = {
        surface: card.hasAttribute('data-surface') ? 'PASS' : 'FAIL',
        cursor: { pass: 0, fail: 0, skip: 0, details: [] },
        minSize: { pass: 0, fail: 0, skip: 0, details: [] },
        hover: { pass: 0, fail: 0, skip: 0, details: [] },
        focusVisible: { pass: 0, fail: 0, skip: 0, details: [] },
      }

      // Find interactive elements (R2–R5)
      for (const role of roles) {
        const els = card.querySelectorAll(`[role="${role}"]`)
        for (const el of els) {
          // Skip wrappers: if this element has a child with the same role, skip it
          if (el.querySelector(`[role="${role}"]`)) continue

          // Skip disabled elements
          if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') {
            results[name].cursor.skip++
            results[name].minSize.skip++
            results[name].hover.skip++
            results[name].focusVisible.skip++
            continue
          }

          const label = el.textContent?.trim()?.slice(0, 30) || role

          // R2: cursor
          const cursor = getComputedStyle(el).cursor
          if (cursor === 'pointer') {
            results[name].cursor.pass++
          } else {
            results[name].cursor.fail++
            results[name].cursor.details.push(`${label}: cursor=${cursor}`)
          }

          // R3: min size
          const rect = el.getBoundingClientRect()
          if (rect.width >= 24 && rect.height >= 24) {
            results[name].minSize.pass++
          } else {
            results[name].minSize.fail++
            results[name].minSize.details.push(`${label}: ${Math.round(rect.width)}×${Math.round(rect.height)}`)
          }
        }
      }
    }

    return results
  }, INTERACTIVE_ROLES)
}

async function checkHoverAndFocus(page, cardIndex, cardName, results) {
  // R4: hover + R5: focus-visible checks need CDP interaction
  const checks = await page.evaluate((roles, ci) => {
    const allDivs = document.querySelectorAll('div[class]')
    let grid = null
    for (const el of allDivs) {
      if (typeof el.className === 'string' && el.className.includes('grid') && el.children.length >= 10) {
        grid = el
        break
      }
    }
    if (!grid) return []

    const card = grid.children[ci]
    if (!card) return []

    const elements = []
    for (const role of roles) {
      const els = card.querySelectorAll(`[role="${role}"]`)
      for (const el of els) {
        if (el.querySelector(`[role="${role}"]`)) continue
        if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') continue

        const label = el.textContent?.trim()?.slice(0, 30) || role
        const before = {
          bg: getComputedStyle(el).backgroundColor,
          color: getComputedStyle(el).color,
          outline: getComputedStyle(el).outline,
          boxShadow: getComputedStyle(el).boxShadow,
        }
        elements.push({ label, before })
      }
    }
    return elements
  }, INTERACTIVE_ROLES, cardIndex)

  // For each element, hover and check
  for (let i = 0; i < checks.length; i++) {
    const { label, before } = checks[i]

    // Hover check
    const hoverResult = await page.evaluate((roles, ci, elemIdx) => {
      const allDivs = document.querySelectorAll('div[class]')
      let grid = null
      for (const el of allDivs) {
        if (typeof el.className === 'string' && el.className.includes('grid') && el.children.length >= 10) {
          grid = el
          break
        }
      }
      if (!grid) return null

      const card = grid.children[ci]
      let idx = 0
      for (const role of roles) {
        const els = card.querySelectorAll(`[role="${role}"]`)
        for (const el of els) {
          if (el.querySelector(`[role="${role}"]`)) continue
          if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') continue
          if (idx === elemIdx) {
            // Dispatch hover event
            el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }))
            el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }))
            const after = {
              bg: getComputedStyle(el).backgroundColor,
              color: getComputedStyle(el).color,
            }
            // Reset
            el.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }))
            el.dispatchEvent(new MouseEvent('mouseout', { bubbles: true }))
            return after
          }
          idx++
        }
      }
      return null
    }, INTERACTIVE_ROLES, cardIndex, i)

    // Note: CSS :hover can't be triggered by JS events alone.
    // We use puppeteer's page.hover() for actual :hover state.
    // But finding the exact element by index is complex.
    // Instead, mark hover as needing real mouse interaction.

    // For now, check if any :hover rules exist via a simpler heuristic:
    // We'll check this in the CSS static analysis instead.
    // Runtime hover checking requires actual mouse positioning which is expensive.
    // Skip hover for now and rely on CSS rule existence.

    // R5: focus-visible
    const focusResult = await page.evaluate((roles, ci, elemIdx) => {
      const allDivs = document.querySelectorAll('div[class]')
      let grid = null
      for (const el of allDivs) {
        if (typeof el.className === 'string' && el.className.includes('grid') && el.children.length >= 10) {
          grid = el
          break
        }
      }
      if (!grid) return null

      const card = grid.children[ci]
      let idx = 0
      for (const role of roles) {
        const els = card.querySelectorAll(`[role="${role}"]`)
        for (const el of els) {
          if (el.querySelector(`[role="${role}"]`)) continue
          if (el.hasAttribute('disabled') || el.getAttribute('aria-disabled') === 'true') continue
          if (idx === elemIdx) {
            const before = {
              outline: getComputedStyle(el).outline,
              boxShadow: getComputedStyle(el).boxShadow,
              bg: getComputedStyle(el).backgroundColor,
            }
            el.focus()
            const after = {
              outline: getComputedStyle(el).outline,
              boxShadow: getComputedStyle(el).boxShadow,
              bg: getComputedStyle(el).backgroundColor,
            }
            el.blur()
            return { before, after }
          }
          idx++
        }
      }
      return null
    }, INTERACTIVE_ROLES, cardIndex, i)

    if (focusResult) {
      const { before: fb, after: fa } = focusResult
      const changed = fb.outline !== fa.outline || fb.boxShadow !== fa.boxShadow || fb.bg !== fa.bg
      if (changed) {
        results[cardName].focusVisible.pass++
      } else {
        results[cardName].focusVisible.fail++
        results[cardName].focusVisible.details.push(`${label}: no focus change`)
      }
    }
  }
}

async function checkHoverViaCSS(cssResults) {
  // Check if :hover rules exist for components that have interactive elements
  const uiDir = join(process.cwd(), 'src/interactive-os/ui')
  const hoverResults = {}

  // Also check global components.css which has role-based :hover rules
  const globalCss = join(process.cwd(), 'src/styles/components.css')
  const globalContent = existsSync(globalCss) ? readFileSync(globalCss, 'utf-8') : ''
  // Roles covered by global :hover rules
  const globalHoverRoles = new Set()
  const globalHoverMatch = globalContent.matchAll(/\[role="(\w+)"\]:hover/g)
  for (const m of globalHoverMatch) {
    globalHoverRoles.add(m[1])
  }

  // Map component names to the roles they render
  const componentRoles = {
    NavList: ['option'], ListBox: ['option'], Combobox: ['option'],
    TabList: ['tab'], MenuList: ['menuitem'],
    RadioGroup: ['radio'], SwitchGroup: ['switch'], Checkbox: ['switch'],
    TreeView: ['treeitem'], TreeGrid: ['row'],
    DisclosureGroup: ['button'], Accordion: ['heading'],
    Kanban: ['option'], Dialog: ['button'], AlertDialog: ['button'],
    Toggle: ['switch'], ToggleGroup: ['button'],
    Toolbar: ['button'], Spinbutton: ['button'],
    Grid: ['row'],
  }

  const files = readdirSync(uiDir).filter(f => f.endsWith('.module.css'))
  for (const file of files) {
    const content = readFileSync(join(uiDir, file), 'utf-8')
    const name = file.replace('.module.css', '')
    const hasLocalHover = /:hover/.test(content)
    const roles = componentRoles[name] || []
    const hasGlobalHover = roles.some(r => globalHoverRoles.has(r))
    hoverResults[name] = hasLocalHover || hasGlobalHover
  }

  return hoverResults
}

/* ── Main ── */

async function main() {
  const execPath = process.env.CHROME_PATH || chromePaths.find(p => existsSync(p))
  if (!execPath) {
    console.error('Chrome not found. Set CHROME_PATH env var.')
    process.exit(1)
  }

  // R6: CSS static analysis
  const uiDir = join(process.cwd(), 'src/interactive-os/ui')
  const cssResults = checkCssTokenUsage(uiDir)
  const hoverCssMap = await checkHoverViaCSS(cssResults)

  // R1–R5: Runtime checks
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: execPath,
    args: ['--no-sandbox'],
  })

  const page = await browser.newPage()

  try {
    await page.goto(`${baseUrl}/internals/theme`, { waitUntil: 'networkidle0', timeout: 10000 })
  } catch (err) {
    console.error(`Failed to connect to ${baseUrl}/internals/theme — is the dev server running?`)
    await browser.close()
    process.exit(1)
  }

  // Wait for showcase grid to render
  await page.waitForFunction(() => {
    const allDivs = document.querySelectorAll('div[class]')
    for (const el of allDivs) {
      if (typeof el.className === 'string' && el.className.includes('grid') && el.children.length >= 10) return true
    }
    return false
  }, { timeout: 5000 })

  const runtimeResults = await checkRuntime(page)

  if (runtimeResults.error) {
    console.error('Error:', runtimeResults.error)
    await browser.close()
    process.exit(1)
  }

  // R4 (hover) + R5 (focus-visible) per card
  const cardNames = Object.keys(runtimeResults)
  for (let i = 0; i < cardNames.length; i++) {
    await checkHoverAndFocus(page, i, cardNames[i], runtimeResults)
  }

  await browser.close()

  // Map showcase card names to their CSS components
  const cardToCssComponents = {
    Kanban: ['Kanban'],
    Preferences: ['SwitchGroup', 'RadioGroup', 'Slider', 'Checkbox'],
    DataView: ['TabList', 'Combobox', 'Grid'],
    Explorer: ['Toolbar', 'TreeView'],
    Hierarchy: ['TreeGrid'],
    InputGroup: ['Spinbutton', 'Toggle', 'ToggleGroup'],
    Sidebar: ['NavList', 'Accordion'],
    Actions: ['Toaster', 'ListBox'],
    Confirm: ['Dialog', 'AlertDialog'],
    Menu: ['DisclosureGroup', 'MenuList'],
  }

  // Build final output
  const output = { components: {}, cssTokens: {}, summary: { total: 0, pass: 0 } }

  for (const [cardName, data] of Object.entries(runtimeResults)) {
    const comp = {
      surface: data.surface,
      cursor: data.cursor.fail === 0 ? 'PASS' : 'FAIL',
      minSize: data.minSize.fail === 0 ? 'PASS' : 'FAIL',
      focusVisible: data.focusVisible.fail === 0 && data.focusVisible.pass > 0 ? 'PASS' : data.focusVisible.pass === 0 && data.focusVisible.fail === 0 ? 'SKIP' : 'FAIL',
    }

    // hover: check if associated CSS files have :hover rules
    const cssComps = cardToCssComponents[cardName] || []
    const hasHover = cssComps.some(c => hoverCssMap[c])
    comp.hover = hasHover ? 'PASS' : 'FAIL'

    // Count
    const checks = ['surface', 'cursor', 'minSize', 'hover', 'focusVisible']
    let cardTotal = 0
    let cardPass = 0
    for (const check of checks) {
      if (comp[check] === 'SKIP') continue
      cardTotal++
      if (comp[check] === 'PASS') cardPass++
    }

    comp.score = `${cardPass}/${cardTotal}`
    comp.details = {}
    if (data.cursor.fail > 0) comp.details.cursor = data.cursor.details
    if (data.minSize.fail > 0) comp.details.minSize = data.minSize.details
    if (data.focusVisible.fail > 0) comp.details.focusVisible = data.focusVisible.details

    output.components[cardName] = comp
    output.summary.total += cardTotal
    output.summary.pass += cardPass
  }

  // CSS token results
  let cssTotal = 0
  let cssPass = 0
  for (const [name, data] of Object.entries(cssResults)) {
    if (data.total === 0) continue
    cssTotal++
    if (data.pass) cssPass++
    else {
      output.cssTokens[name] = {
        score: `${data.tokenized}/${data.total}`,
        violations: data.violations.map(v => `L${v.line}: ${v.prop}: ${v.value}`),
      }
    }
  }

  output.summary.total += cssTotal
  output.summary.pass += cssPass
  output.summary.cssFiles = `${cssPass}/${cssTotal}`
  output.summary.score = output.summary.total > 0
    ? `${((output.summary.pass / output.summary.total) * 100).toFixed(1)}%`
    : '0%'

  console.log(JSON.stringify(output, null, 2))
}

main().catch(e => {
  console.error(e.message)
  process.exit(1)
})

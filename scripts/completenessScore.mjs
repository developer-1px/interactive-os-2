#!/usr/bin/env node
/**
 * Component Completeness Score — 분류별 필수 요소 존재 여부 검사
 *
 * Usage: node scripts/completenessScore.mjs
 *
 * 레퍼런스: docs/3-resources/22-[design]componentCompletenessBaseline.md
 * 5개 UI 라이브러리 횡단 조사에서 추출한 필수 요소 교집합 기반.
 *
 * 점수 = (존재하는 필수 항목) / (총 필수 항목) × 100
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const UI_DIR = join(process.cwd(), 'src/interactive-os/ui')
const STYLES_DIR = join(process.cwd(), 'src/styles')

/* ── Component → Classification mapping ── */

const CLASSIFICATIONS = {
  Action: ['Button', 'Toggle', 'ToggleGroup', 'Toolbar'],
  Input: ['TextInput', 'Spinbutton', 'Slider', 'ColorInput', 'Combobox'],
  Selection: ['Checkbox', 'RadioGroup', 'SwitchGroup'],
  Overlay: ['Dialog', 'AlertDialog', 'Tooltip'],
  Collection: ['ListBox', 'TreeGrid', 'TreeView', 'TabList', 'MenuList', 'NavList', 'Accordion', 'DisclosureGroup', 'Kanban', 'Grid'],
}

/* ── Per-classification required checks ── */
/* Each check: { id, label, test(css, component, globals) → boolean } */

function readFile(path) {
  return existsSync(path) ? readFileSync(path, 'utf-8') : ''
}

const interactiveCss = readFile(join(STYLES_DIR, 'interactive.css'))
const componentsCss = readFile(join(STYLES_DIR, 'components.css'))
const globalCss = interactiveCss || componentsCss

const PATTERN_DIR = join(process.cwd(), 'src/interactive-os/pattern')

function readPattern(comp) {
  const map = { Dialog: 'dialog', AlertDialog: 'alertdialog', Tooltip: 'tooltip' }
  const name = map[comp]
  if (!name) return ''
  return readFile(join(PATTERN_DIR, `${name}.ts`))
}

const ACTION_CHECKS = [
  { id: 'variant-primary', label: 'variant: primary/filled', test: (css) => /--tone-primary-base/.test(css) || /primary|accent|filled/.test(css) },
  { id: 'variant-outline', label: 'variant: outline', test: (css) => /outline|dialog|ghost/.test(css) && /border/.test(css) },
  { id: 'variant-ghost', label: 'variant: ghost/subtle', test: (css) => /ghost|subtle/.test(css) },
  { id: 'variant-destructive', label: 'variant: destructive', test: (css) => /destructive|--tone-destructive/.test(css) },
  { id: 'size-sm', label: 'size: sm', test: (css) => /\.sm\b|size.*sm|--shape-xs|--shape-sm/.test(css) },
  { id: 'size-md', label: 'size: md (default)', test: (css) => /--shape-md|padding/.test(css) },
  { id: 'size-lg', label: 'size: lg', test: (css) => /\.lg\b|size.*lg|--shape-lg/.test(css) },
  { id: 'state-hover', label: 'state: hover', test: (css, _c, g) => /:hover/.test(css) || /\[role.*:hover/.test(g) },
  { id: 'state-focus', label: 'state: focus-visible', test: (css, _c, g) => /:focus-visible|:focus/.test(css) || /focus-visible|data-focused/.test(g) },
  { id: 'state-active', label: 'state: active/pressed', test: (css, _c, g) => /:active|pressed|scale/.test(css) || /:active/.test(g) },
  { id: 'state-disabled', label: 'state: disabled', test: (css, _c, g) => /:disabled|aria-disabled|disabled/.test(css) || /aria-disabled|:disabled/.test(g) },
  { id: 'motion', label: 'transition: motion bundle', test: (css) => /--motion-|transition/.test(css) },
]

const INPUT_CHECKS = [
  { id: 'state-focus', label: 'state: focus (border/ring)', test: (css) => (/:focus/.test(css) && /border|outline|--focus/.test(css)) || /data-focused|Focused/.test(css) },
  { id: 'state-disabled', label: 'state: disabled', test: (css, _c, g) => /:disabled|aria-disabled/.test(css) || /aria-disabled|:disabled/.test(g) },
  { id: 'state-invalid', label: 'state: invalid/error', test: (css, _c, g) => /aria-invalid|invalid|error|--tone-destructive/.test(css) || /aria-invalid/.test(g) },
  { id: 'height', label: 'height: --input-height', test: (css, comp) => {
    if (comp === 'Slider') return true // N/A — slider uses track/thumb, not input height
    return /--input-height|height.*44|min-height/.test(css)
  }},
  { id: 'radius', label: 'radius: shape bundle', test: (css) => /--shape-.*-radius|border-radius/.test(css) },
  { id: 'left-section', label: 'leftSection (icon slot)', test: (css, comp) => {
    if (['Slider', 'ColorInput'].includes(comp)) return true // N/A — no text input
    const tsx = readFile(join(UI_DIR, `${comp}.tsx`))
    return /leftSection|left.*icon|startAdornment|leading/.test(css) || /leftSection|startIcon|leading/.test(tsx)
  }},
  { id: 'right-section', label: 'rightSection (icon slot)', test: (css, comp) => {
    if (['Slider', 'ColorInput'].includes(comp)) return true // N/A — no text input
    const tsx = readFile(join(UI_DIR, `${comp}.tsx`))
    return /rightSection|right.*icon|endAdornment|trailing/.test(css) || /rightSection|endIcon|trailing/.test(tsx)
  }},
  { id: 'placeholder', label: 'placeholder styling', test: (css, comp) => {
    if (['Slider', 'ColorInput'].includes(comp)) return true // N/A
    return /::placeholder/.test(css)
  }},
  { id: 'motion', label: 'transition: motion bundle', test: (css) => /--motion-|transition/.test(css) },
]

const SELECTION_CHECKS = [
  { id: 'state-checked', label: 'state: checked', test: (css) => /checked|aria-checked|--tone-primary/.test(css) },
  { id: 'state-unchecked', label: 'state: unchecked (empty)', test: (css) => /border.*--border|box\b/.test(css) },
  { id: 'state-indeterminate', label: 'state: indeterminate', test: (css, comp) => {
    if (comp === 'SwitchGroup') return true // N/A for switch
    return /indeterminate/.test(css) || /indeterminate/.test(readFile(join(UI_DIR, `${comp}.tsx`)))
  }},
  { id: 'state-disabled', label: 'state: disabled', test: (css, _c, g) => /:disabled|aria-disabled/.test(css) || /aria-disabled|:disabled/.test(g) },
  { id: 'state-focus', label: 'state: focus-visible', test: (css, _c, g) => /:focus|focus-visible|Focused/.test(css) || /data-focused/.test(g) },
  { id: 'state-hover', label: 'state: hover', test: (css, _c, g) => /:hover|Hover/.test(css) || /\[role.*:hover/.test(g) },
  { id: 'indicator', label: 'indicator icon (check/dash)', test: (css, comp) => {
    const tsx = readFile(join(UI_DIR, `${comp}.tsx`))
    return /indicator|check|Check|✓|✔|svg|Icon/.test(css) || /indicator|Check|svg|icon/i.test(tsx)
  }},
  { id: 'label', label: 'label association', test: (_css, comp) => {
    const tsx = readFile(join(UI_DIR, `${comp}.tsx`))
    return /label|Label|htmlFor|aria-label/.test(tsx)
  }},
  { id: 'motion', label: 'transition: motion', test: (css) => /--motion-|transition/.test(css) },
]

const OVERLAY_CHECKS = [
  { id: 'backdrop', label: 'backdrop', test: (css, comp) => {
    if (comp === 'Tooltip') return true // N/A — tooltips don't have backdrops
    return /backdrop|--dialog-backdrop|overlay/.test(css)
  }},
  { id: 'surface', label: 'surface: overlay bundle', test: (css) => /--surface-overlay|surface-overlay|data-surface|--surface-raised/.test(css) },
  { id: 'title', label: 'title (aria-labelledby)', test: (css, comp) => {
    if (comp === 'Tooltip') return true // N/A — tooltip is the title itself
    const tsx = readFile(join(UI_DIR, `${comp}.tsx`))
    return /header|title|Title/i.test(css) || /aria-labelledby|Title/.test(tsx)
  }},
  { id: 'description', label: 'description (aria-describedby)', test: (css, comp) => {
    const tsx = readFile(join(UI_DIR, `${comp}.tsx`))
    return /body|description|Description/i.test(css) || /aria-describedby|Description|tooltip/.test(tsx)
  }},
  { id: 'close-trigger', label: 'close trigger', test: (_css, comp) => {
    if (comp === 'Tooltip') return true // N/A — tooltips close on blur/mouseleave
    const tsx = readFile(join(UI_DIR, `${comp}.tsx`))
    const pattern = readPattern(comp)
    return /close|Close|onClose|dismiss/.test(tsx) || /dismiss/.test(pattern)
  }},
  { id: 'close-escape', label: 'close on Escape', test: (_css, comp) => {
    if (comp === 'Tooltip') return true // N/A
    const tsx = readFile(join(UI_DIR, `${comp}.tsx`))
    const pattern = readPattern(comp)
    return /Escape|escape|dismiss|onClose/.test(tsx) || /dismiss/.test(pattern)
  }},
  { id: 'shadow', label: 'shadow (--shadow-lg)', test: (css) => /--shadow-lg|--shadow-md|box-shadow/.test(css) },
  { id: 'radius', label: 'radius', test: (css) => /--shape-.*-radius|border-radius/.test(css) },
  { id: 'motion-enter', label: 'enter animation (--motion-enter)', test: (css) => /--motion-enter|animation|@keyframes|transition/.test(css) },
  { id: 'destructive-tone', label: 'destructive tone (AlertDialog)', test: (css, comp) => {
    if (comp !== 'AlertDialog') return true // N/A
    return /destructive|--tone-destructive/.test(css) || /destructive/.test(readFile(join(UI_DIR, `${comp}.tsx`)))
  }},
]

const COLLECTION_CHECKS = [
  { id: 'disabled-item', label: 'disabled item (aria-disabled)', test: (_css, _c, g) => /aria-disabled/.test(g) },
  { id: 'disabled-selected', label: 'disabled + selected compound', test: (_css, _c, g) => /aria-disabled.*aria-selected|aria-selected.*aria-disabled/.test(g) || (/aria-disabled/.test(g) && /aria-selected/.test(g)) },
]

const CHECKS_BY_CLASS = {
  Action: ACTION_CHECKS,
  Input: INPUT_CHECKS,
  Selection: SELECTION_CHECKS,
  Overlay: OVERLAY_CHECKS,
  Collection: COLLECTION_CHECKS,
}

/* ── Run checks ── */

function checkComponent(component, classification) {
  const cssPath = join(UI_DIR, `${component}.module.css`)
  const css = readFile(cssPath)
  const checks = CHECKS_BY_CLASS[classification]
  const results = []

  for (const check of checks) {
    const pass = check.test(css, component, globalCss)
    results.push({ id: check.id, label: check.label, pass })
  }

  const passed = results.filter(r => r.pass).length
  const total = results.length
  const score = total > 0 ? Math.round((passed / total) * 100) : 0

  return { component, classification, results, passed, total, score }
}

/* ── Output formatting ── */

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
}

function scoreColor(score) {
  if (score >= 80) return COLORS.green
  if (score >= 50) return COLORS.yellow
  return COLORS.red
}

function main() {
  const allResults = []

  for (const [classification, components] of Object.entries(CLASSIFICATIONS)) {
    for (const comp of components) {
      allResults.push(checkComponent(comp, classification))
    }
  }

  // Sort by score ascending (worst first)
  allResults.sort((a, b) => a.score - b.score)

  // Output
  console.log(`\n${COLORS.bold}Component Completeness Score${COLORS.reset}`)
  console.log(`${'─'.repeat(70)}\n`)

  let totalPassed = 0
  let totalChecks = 0
  const byClass = {}

  for (const r of allResults) {
    const color = scoreColor(r.score)
    const bar = '█'.repeat(Math.round(r.score / 5)) + '░'.repeat(20 - Math.round(r.score / 5))
    const missing = r.results.filter(c => !c.pass).map(c => c.label)

    console.log(`${color}${String(r.score).padStart(3)}%${COLORS.reset} ${bar} ${COLORS.bold}${r.component.padEnd(18)}${COLORS.reset} ${COLORS.dim}${r.classification}${COLORS.reset} ${COLORS.dim}(${r.passed}/${r.total})${COLORS.reset}`)

    if (missing.length > 0) {
      console.log(`     ${COLORS.red}missing:${COLORS.reset} ${COLORS.dim}${missing.join(', ')}${COLORS.reset}`)
    }

    totalPassed += r.passed
    totalChecks += r.total

    if (!byClass[r.classification]) byClass[r.classification] = { passed: 0, total: 0 }
    byClass[r.classification].passed += r.passed
    byClass[r.classification].total += r.total
  }

  // Summary
  const totalScore = totalChecks > 0 ? Math.round((totalPassed / totalChecks) * 100) : 0
  const totalColor = scoreColor(totalScore)

  console.log(`\n${'─'.repeat(70)}`)
  console.log(`\n${COLORS.bold}By Classification:${COLORS.reset}\n`)

  for (const [cls, data] of Object.entries(byClass)) {
    const s = Math.round((data.passed / data.total) * 100)
    const c = scoreColor(s)
    console.log(`  ${c}${String(s).padStart(3)}%${COLORS.reset} ${cls.padEnd(12)} ${COLORS.dim}(${data.passed}/${data.total})${COLORS.reset}`)
  }

  console.log(`\n${totalColor}${COLORS.bold}Total: ${totalScore}%${COLORS.reset} ${COLORS.dim}(${totalPassed}/${totalChecks})${COLORS.reset}\n`)

  // Exit code: 0 if 100%, 1 otherwise (for CI)
  process.exit(totalScore === 100 ? 0 : 1)
}

main()

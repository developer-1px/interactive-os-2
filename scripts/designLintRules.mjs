// ② 2026-03-26-design-lint-prd.md
/**
 * Design Lint Rules — 순수 DOM/CSSOM 기반 디자인 위반 감지
 *
 * 모든 규칙은 브라우저 컨텍스트에서 실행된다.
 * - Playwright page.evaluate()
 * - Claude in Chrome javascript_tool
 * - 브라우저 콘솔
 *
 * 규칙은 프로젝트 비의존 — 아무 페이지에서 실행 가능.
 */

/**
 * 전체 규칙 실행. self-contained — 외부 클로저 참조 없음.
 * page.evaluate(runDesignLint) 형태로 사용 가능.
 *
 * @param {Element} [root=document.body]
 * @param {{ rules?: string[] }} [options]
 * @returns {{ violations: Array<{rule:string, selector:string, message:string, expected:string, actual:string, severity:string}>, summary: {total:number, passed:number, failed:number, score:string} }}
 */
export function runDesignLint(root, options) {
  if (!root) root = document.body
  if (!options) options = {}
  const enabledRules = options.rules || null // null = all

  // ── Helpers ──

  function isVisible(el) {
    const style = getComputedStyle(el)
    if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false
    const rect = el.getBoundingClientRect()
    return rect.width > 0 && rect.height > 0
  }

  function describeElement(el) {
    const tag = el.tagName.toLowerCase()
    const role = el.getAttribute('role')
    const cls = el.className && typeof el.className === 'string' ? el.className.split(' ').filter(Boolean).slice(0, 2).join('.') : ''
    const text = (el.textContent || '').trim().slice(0, 20)
    let desc = role ? `[role="${role}"]` : tag
    if (cls) desc += `.${cls}`
    if (text) desc += ` "${text}"`
    return desc
  }

  function selectorPath(el) {
    const tag = el.tagName.toLowerCase()
    const role = el.getAttribute('role')
    const id = el.id
    if (id) return `#${id}`
    if (role) return `${tag}[role="${role}"]`
    const cls = el.className && typeof el.className === 'string' ? el.className.split(' ').filter(Boolean)[0] : ''
    if (cls) return `${tag}.${cls}`
    return tag
  }

  function parseSpacing(style, prop) {
    return parseFloat(style[prop]) || 0
  }

  function isMediaElement(el) {
    const tag = el.tagName.toLowerCase()
    return tag === 'img' || tag === 'video' || tag === 'canvas' || tag === 'picture'
  }

  function isInteractive(el) {
    const tag = el.tagName.toLowerCase()
    if (tag === 'button' || tag === 'a' || tag === 'input' || tag === 'select' || tag === 'textarea') return true
    const role = el.getAttribute('role')
    if (!role) return false
    const interactiveRoles = ['button', 'link', 'tab', 'menuitem', 'option', 'radio', 'checkbox', 'switch', 'slider', 'spinbutton', 'combobox', 'searchbox', 'textbox', 'treeitem']
    return interactiveRoles.includes(role)
  }

  function shouldSkip(el) {
    if (!isVisible(el)) return true
    const tag = el.tagName.toLowerCase()
    if (tag === 'svg' || tag === 'canvas' || el.closest('svg') || el.closest('canvas')) return true
    return false
  }

  function getEffectiveGap(el) {
    const style = getComputedStyle(el)
    // gap (CSS gap property, for flex/grid)
    const gap = parseFloat(style.gap) || parseFloat(style.rowGap) || parseFloat(style.columnGap) || 0
    if (gap > 0) return { value: gap, source: 'gap' }

    // fallback: measure actual distance between children
    const children = [...el.children].filter(c => isVisible(c))
    if (children.length < 2) return { value: 0, source: 'none' }

    const rects = children.map(c => c.getBoundingClientRect())
    let minGap = Infinity
    for (let i = 1; i < rects.length; i++) {
      const vGap = rects[i].top - rects[i - 1].bottom
      const hGap = rects[i].left - rects[i - 1].right
      const effectiveGap = Math.max(vGap, hGap)
      if (effectiveGap >= 0 && effectiveGap < minGap) minGap = effectiveGap
    }
    if (minGap === Infinity) return { value: 0, source: 'none' }
    return { value: Math.round(minGap * 10) / 10, source: 'measured' }
  }

  const violations = []
  const ruleResults = {}

  function addViolation(rule, el, message, expected, actual, severity) {
    violations.push({
      rule,
      selector: selectorPath(el),
      element: describeElement(el),
      message,
      expected,
      actual,
      severity,
    })
  }

  // ── Rule: content-border-collision ──
  // 텍스트/아이콘이 부모 경계에 붙어 있음 (padding=0)

  function ruleContentBorderCollision() {
    const candidates = root.querySelectorAll('[role], button, a, li, td, th, label, div, section, article, aside, main, header, footer, p, span, h1, h2, h3, h4, h5, h6')
    let checked = 0
    let passed = 0

    for (const el of candidates) {
      if (shouldSkip(el)) continue

      const style = getComputedStyle(el)
      const hasBg = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent'
      const hasBorder = style.borderWidth !== '0px' && style.borderStyle !== 'none'
      if (!hasBg && !hasBorder) continue

      // Must have direct text content
      const hasDirectText = [...el.childNodes].some(n =>
        n.nodeType === 3 && n.textContent.trim().length > 0
      )
      if (!hasDirectText) continue

      // Media elements are exempt
      if (isMediaElement(el)) continue

      checked++

      const pL = parseSpacing(style, 'paddingLeft')
      const pR = parseSpacing(style, 'paddingRight')
      const pT = parseSpacing(style, 'paddingTop')
      const pB = parseSpacing(style, 'paddingBottom')
      const minH = Math.min(pL, pR)
      const minV = Math.min(pT, pB)

      if (minH > 0 && minV >= 0) {
        passed++
      } else {
        addViolation(
          'content-border-collision', el,
          'Text touches parent boundary',
          'padding > 0 on all sides with text',
          `padding: ${pT}/${pR}/${pB}/${pL}`,
          'error'
        )
      }
    }
    return { checked, passed }
  }

  // ── Rule: internal-gt-external ──
  // 컨테이너 padding > 컨테이너 간 gap이면 위반

  function ruleInternalGtExternal() {
    const containers = root.querySelectorAll('[role="list"], [role="listbox"], [role="grid"], [role="tree"], [role="tablist"], [role="menu"], [role="toolbar"], [role="group"], ul, ol, nav, section, article, main, div')
    let checked = 0
    let passed = 0

    for (const container of containers) {
      if (shouldSkip(container)) continue

      const children = [...container.children].filter(c => isVisible(c))
      if (children.length < 2) continue

      const parentGap = getEffectiveGap(container)
      if (parentGap.value <= 0) continue

      for (const child of children) {
        const childStyle = getComputedStyle(child)
        const childBg = childStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && childStyle.backgroundColor !== 'transparent'
        const childBorder = childStyle.borderWidth !== '0px' && childStyle.borderStyle !== 'none'
        if (!childBg && !childBorder) continue

        const maxPadding = Math.max(
          parseSpacing(childStyle, 'paddingTop'),
          parseSpacing(childStyle, 'paddingRight'),
          parseSpacing(childStyle, 'paddingBottom'),
          parseSpacing(childStyle, 'paddingLeft')
        )

        if (maxPadding <= 0) continue

        checked++

        if (maxPadding <= parentGap.value) {
          passed++
        } else {
          addViolation(
            'internal-gt-external', child,
            `Container padding (${maxPadding}px) exceeds parent gap (${parentGap.value}px)`,
            `padding ≤ parent gap (${parentGap.value}px)`,
            `padding: ${maxPadding}px`,
            'error'
          )
        }
      }
    }
    return { checked, passed }
  }

  // ── Rule: depth-inversion ──
  // 자식 컨테이너의 gap > 부모 컨테이너의 gap

  function ruleDepthInversion() {
    const containers = root.querySelectorAll('[role="list"], [role="listbox"], [role="grid"], [role="tree"], [role="tablist"], [role="menu"], [role="toolbar"], [role="group"], ul, ol, nav, section, article, main, div')
    let checked = 0
    let passed = 0

    for (const container of containers) {
      if (shouldSkip(container)) continue

      const containerGap = getEffectiveGap(container)
      if (containerGap.value <= 0) continue

      // Find nested containers
      const nestedContainers = container.querySelectorAll('[role="list"], [role="listbox"], [role="grid"], [role="tree"], [role="group"], ul, ol, div')

      for (const nested of nestedContainers) {
        if (nested === container) continue
        if (nested.parentElement !== container && !nested.parentElement?.closest?.('[role]')) continue
        if (shouldSkip(nested)) continue

        const nestedGap = getEffectiveGap(nested)
        if (nestedGap.value <= 0) continue

        checked++

        if (nestedGap.value <= containerGap.value) {
          passed++
        } else {
          addViolation(
            'depth-inversion', nested,
            `Child gap (${nestedGap.value}px) exceeds parent gap (${containerGap.value}px)`,
            `child gap ≤ parent gap (${containerGap.value}px)`,
            `child gap: ${nestedGap.value}px`,
            'error'
          )
        }
      }
    }
    return { checked, passed }
  }

  // ── Rule: alignment-axis-overflow ──
  // 고유 정렬 축(x 좌표)이 과다

  function ruleAlignmentAxisOverflow() {
    const GRID = 8
    const THRESHOLD_RATIO = 0.4
    const xCoords = new Set()
    let elementCount = 0

    const SHELL_SELECTOR = 'nav, header, [role="navigation"], [role="banner"], [class*="sidebar"], [class*="Sidebar"], [class*="activityBar"], [class*="ActivityBar"]'
    const candidates = root.querySelectorAll('[role], button, a, input, select, textarea, label, span, p, h1, h2, h3, h4, h5, h6, li, td, th, img')

    for (const el of candidates) {
      if (el.closest(SHELL_SELECTOR)) continue
      if (shouldSkip(el)) continue
      const rect = el.getBoundingClientRect()
      if (rect.width > 800 && rect.height > 600) continue
      elementCount++
      xCoords.add(Math.round(rect.left / GRID) * GRID)
    }

    if (elementCount < 10) return { checked: 0, passed: 0 }

    const ratio = xCoords.size / elementCount
    const checked = 1
    const passed = ratio <= THRESHOLD_RATIO ? 1 : 0

    if (!passed) {
      addViolation(
        'alignment-axis-overflow', root,
        `${xCoords.size} unique X positions for ${elementCount} elements (ratio: ${(ratio).toFixed(3)})`,
        `ratio ≤ ${THRESHOLD_RATIO}`,
        `ratio: ${(ratio).toFixed(3)}`,
        'warning'
      )
    }

    return { checked, passed }
  }

  // ── Rule: decoration-overload ──
  // 요소에 동시 장식 3개 이상

  function ruleDecorationOverload() {
    const THRESHOLD = 2
    const DECORATION_PROPS = [
      { prop: 'borderWidth', none: ['0px', '0px 0px 0px 0px'] },
      { prop: 'boxShadow', none: ['none', ''] },
      { prop: 'backgroundColor', none: ['rgba(0, 0, 0, 0)', 'transparent', ''] },
    ]

    const candidates = root.querySelectorAll('[role], button, a, input, select, textarea, [class]')
    let checked = 0
    let passed = 0

    for (const el of candidates) {
      if (shouldSkip(el)) continue
      if (el.closest('[role="switch"]')) continue

      const style = getComputedStyle(el)
      let count = 0
      const active = []

      for (const { prop, none } of DECORATION_PROPS) {
        const value = style[prop]
        if (value && !none.includes(value)) {
          count++
          active.push(`${prop}=${value}`)
        }
      }

      if (count === 0) continue
      checked++

      if (count <= THRESHOLD) {
        passed++
      } else {
        addViolation(
          'decoration-overload', el,
          `${count} simultaneous decorations (max ${THRESHOLD})`,
          `≤ ${THRESHOLD} decorations`,
          active.join(', '),
          'warning'
        )
      }
    }
    return { checked, passed }
  }

  // ── Rule: same-role-different-spacing ──
  // 동일 role 요소들의 padding 불일치

  function ruleSameRoleDifferentSpacing() {
    const roleMap = new Map()

    const candidates = root.querySelectorAll('[role]')
    for (const el of candidates) {
      if (shouldSkip(el)) continue
      const role = el.getAttribute('role')
      if (!role) continue
      // Skip generic roles
      if (role === 'presentation' || role === 'none' || role === 'group' || role === 'region') continue

      const style = getComputedStyle(el)
      const padding = `${Math.round(parseSpacing(style, 'paddingTop'))}/${Math.round(parseSpacing(style, 'paddingRight'))}/${Math.round(parseSpacing(style, 'paddingBottom'))}/${Math.round(parseSpacing(style, 'paddingLeft'))}`

      if (!roleMap.has(role)) roleMap.set(role, { paddings: new Set(), elements: [] })
      const entry = roleMap.get(role)
      entry.paddings.add(padding)
      entry.elements.push(el)
    }

    let checked = 0
    let passed = 0

    for (const [role, { paddings, elements }] of roleMap) {
      if (elements.length < 2) continue
      checked++

      if (paddings.size <= 1) {
        passed++
      } else {
        addViolation(
          'same-role-different-spacing', elements[0],
          `role="${role}" has ${paddings.size} different padding patterns across ${elements.length} elements`,
          'consistent padding for same role',
          [...paddings].join(' vs '),
          'warning'
        )
      }
    }
    return { checked, passed }
  }

  // ── Rule: touch-target-too-small ──
  // Interactive 요소 44×44px 미만

  function ruleTouchTargetTooSmall() {
    const MIN_SIZE = 44
    const candidates = root.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], [role="radio"], [role="checkbox"], [role="switch"], [role="slider"], [role="spinbutton"], [role="combobox"], [role="treeitem"]')
    let checked = 0
    let passed = 0

    for (const el of candidates) {
      if (shouldSkip(el)) continue

      // Skip disabled elements
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue

      const rect = el.getBoundingClientRect()
      checked++

      if (rect.width >= MIN_SIZE && rect.height >= MIN_SIZE) {
        passed++
      } else {
        addViolation(
          'touch-target-too-small', el,
          `Interactive element is ${Math.round(rect.width)}×${Math.round(rect.height)}px`,
          `≥ ${MIN_SIZE}×${MIN_SIZE}px`,
          `${Math.round(rect.width)}×${Math.round(rect.height)}px`,
          'error'
        )
      }
    }
    return { checked, passed }
  }

  // ── Rule: focus-no-feedback ──
  // focus 상태에서 시각 변화 없음

  function ruleFocusNoFeedback() {
    const candidates = root.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], [role="radio"], [role="checkbox"], [role="switch"], [role="treeitem"]')
    let checked = 0
    let passed = 0

    const previousFocus = document.activeElement

    const COMPARE_PROPS = ['outline', 'outlineColor', 'outlineWidth', 'outlineStyle', 'boxShadow', 'backgroundColor', 'borderColor']

    for (const el of candidates) {
      if (shouldSkip(el)) continue
      if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue
      // Only check a sample to avoid excessive focus changes
      if (checked >= 20) break

      const beforeStyle = getComputedStyle(el)
      const before = {}
      for (const p of COMPARE_PROPS) before[p] = beforeStyle[p]

      el.focus({ preventScroll: true })

      const afterStyle = getComputedStyle(el)
      let changed = false
      for (const p of COMPARE_PROPS) {
        if (before[p] !== afterStyle[p]) { changed = true; break }
      }

      checked++

      if (changed) {
        passed++
      } else {
        addViolation(
          'focus-no-feedback', el,
          'No visual change on focus',
          'outline, boxShadow, or backgroundColor change on :focus-visible',
          'no computed style diff',
          'warning'
        )
      }
    }

    // Restore original focus
    if (previousFocus && typeof previousFocus.focus === 'function') {
      try { previousFocus.focus({ preventScroll: true }) } catch {}
    } else {
      try { document.body.focus({ preventScroll: true }) } catch {}
    }

    return { checked, passed }
  }

  // ── Run selected rules ──

  const allRules = {
    'content-border-collision': ruleContentBorderCollision,
    'internal-gt-external': ruleInternalGtExternal,
    'depth-inversion': ruleDepthInversion,
    'alignment-axis-overflow': ruleAlignmentAxisOverflow,
    'decoration-overload': ruleDecorationOverload,
    'same-role-different-spacing': ruleSameRoleDifferentSpacing,
    'touch-target-too-small': ruleTouchTargetTooSmall,
    'focus-no-feedback': ruleFocusNoFeedback,
  }

  const rulesToRun = enabledRules
    ? Object.fromEntries(Object.entries(allRules).filter(([k]) => enabledRules.includes(k)))
    : allRules

  let totalChecked = 0
  let totalRules = 0
  let passedRules = 0

  for (const [name, fn] of Object.entries(rulesToRun)) {
    const result = fn()
    ruleResults[name] = result
    if (result.checked > 0) {
      totalRules++
      totalChecked += result.checked
      if (result.passed === result.checked) passedRules++
    }
  }

  return {
    violations,
    ruleResults,
    summary: {
      totalRules,
      passedRules,
      totalChecked,
      totalViolations: violations.length,
      errors: violations.filter(v => v.severity === 'error').length,
      warnings: violations.filter(v => v.severity === 'warning').length,
      score: totalRules > 0 ? `${passedRules}/${totalRules}` : '0/0',
    },
  }
}

/**
 * violations 배열을 LLM-readable 텍스트로 변환
 */
export function formatReport(result) {
  const { violations, summary } = result
  const lines = []

  if (violations.length === 0) {
    lines.push(`Design Lint: CLEAN — ${summary.score} rules passed, ${summary.totalChecked} elements checked`)
    return lines.join('\n')
  }

  lines.push(`Design Lint: ${summary.totalViolations} violations (${summary.errors} errors, ${summary.warnings} warnings)`)
  lines.push('')

  // Group by rule
  const byRule = new Map()
  for (const v of violations) {
    if (!byRule.has(v.rule)) byRule.set(v.rule, [])
    byRule.get(v.rule).push(v)
  }

  for (const [rule, ruleViolations] of byRule) {
    const sev = ruleViolations[0].severity.toUpperCase()
    lines.push(`[${sev}] ${rule} (${ruleViolations.length} violation${ruleViolations.length > 1 ? 's' : ''})`)

    // Show up to 5 per rule to avoid overwhelming output
    const shown = ruleViolations.slice(0, 5)
    for (const v of shown) {
      lines.push(`  → ${v.element}`)
      lines.push(`  → ${v.message}`)
      lines.push(`  → Expected: ${v.expected}`)
      lines.push(`  → Actual: ${v.actual}`)
      lines.push('')
    }
    if (ruleViolations.length > 5) {
      lines.push(`  ... and ${ruleViolations.length - 5} more`)
      lines.push('')
    }
  }

  lines.push(`Score: ${summary.score} rules passed`)

  return lines.join('\n')
}

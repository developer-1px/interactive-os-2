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
 *
 * 아키텍처: 선언적 OCP — 규칙은 선언=등록, 합성(runner) 런타임 불변.
 * 규칙 추가 = rules 배열에 객체 하나 추가. runner 수정 불필요.
 */

/**
 * 전체 규칙 실행. self-contained — 외부 클로저 참조 없음.
 * page.evaluate(runDesignLint) 형태로 사용 가능.
 *
 * @param {Element} [root=document.body]
 * @param {{ rules?: string[] }} [options]
 */
export function runDesignLint(root, options) {
  if (!root) root = document.body
  if (!options) options = {}
  const enabledRuleIds = options.rules || null // null = all

  // ── Shared context ──

  const violations = []

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

  function shouldSkip(el) {
    if (!isVisible(el)) return true
    const tag = el.tagName.toLowerCase()
    if (tag === 'svg' || tag === 'canvas' || el.closest('svg') || el.closest('canvas')) return true
    return false
  }

  function getEffectiveGap(el) {
    const style = getComputedStyle(el)
    const gap = parseFloat(style.gap) || parseFloat(style.rowGap) || parseFloat(style.columnGap) || 0
    if (gap > 0) return { value: gap, source: 'gap' }
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

  function addViolation(ruleId, el, message, expected, actual, severity) {
    violations.push({
      rule: ruleId,
      selector: selectorPath(el),
      element: describeElement(el),
      message, expected, actual, severity,
    })
  }

  const ctx = { root, isVisible, shouldSkip, describeElement, selectorPath, parseSpacing, getEffectiveGap, addViolation }

  // ════════════════════════════════════════════════════
  // Rules registry — 선언 = 등록. 추가 = 이 배열에 객체 추가.
  // ════════════════════════════════════════════════════

  const rules = [

    // ── content-border-collision ──
    {
      id: 'content-border-collision',
      severity: 'error',
      run(c) {
        const candidates = c.root.querySelectorAll('[role], button, a, li, td, th, label, div, section, article, aside, main, header, footer, p, span, h1, h2, h3, h4, h5, h6')
        let checked = 0, passed = 0

        for (const el of candidates) {
          if (c.shouldSkip(el)) continue
          const style = getComputedStyle(el)
          const hasBg = style.backgroundColor !== 'rgba(0, 0, 0, 0)' && style.backgroundColor !== 'transparent'
          const hasBorder = style.borderWidth !== '0px' && style.borderStyle !== 'none'
          if (!hasBg && !hasBorder) continue

          const hasDirectText = [...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 0)
          if (!hasDirectText) continue

          const tag = el.tagName.toLowerCase()
          if (tag === 'img' || tag === 'video' || tag === 'canvas' || tag === 'picture') continue

          checked++
          const pL = c.parseSpacing(style, 'paddingLeft')
          const pR = c.parseSpacing(style, 'paddingRight')
          const pT = c.parseSpacing(style, 'paddingTop')
          const pB = c.parseSpacing(style, 'paddingBottom')

          if (Math.min(pL, pR) > 0 && Math.min(pT, pB) >= 0) {
            passed++
          } else {
            c.addViolation(this.id, el, 'Text touches parent boundary', 'padding > 0 on all sides with text', `padding: ${pT}/${pR}/${pB}/${pL}`, this.severity)
          }
        }
        return { checked, passed }
      },
    },

    // ── internal-gt-external ──
    {
      id: 'internal-gt-external',
      severity: 'error',
      run(c) {
        const containers = c.root.querySelectorAll('[role="list"], [role="listbox"], [role="grid"], [role="tree"], [role="tablist"], [role="menu"], [role="toolbar"], [role="group"], ul, ol, nav, section, article, main, div')
        let checked = 0, passed = 0

        for (const container of containers) {
          if (c.shouldSkip(container)) continue
          const children = [...container.children].filter(ch => c.isVisible(ch))
          if (children.length < 2) continue

          const parentGap = c.getEffectiveGap(container)
          if (parentGap.value <= 0) continue

          for (const child of children) {
            const childStyle = getComputedStyle(child)
            const childBg = childStyle.backgroundColor !== 'rgba(0, 0, 0, 0)' && childStyle.backgroundColor !== 'transparent'
            const childBorder = childStyle.borderWidth !== '0px' && childStyle.borderStyle !== 'none'
            if (!childBg && !childBorder) continue

            const maxPadding = Math.max(
              c.parseSpacing(childStyle, 'paddingTop'), c.parseSpacing(childStyle, 'paddingRight'),
              c.parseSpacing(childStyle, 'paddingBottom'), c.parseSpacing(childStyle, 'paddingLeft')
            )
            if (maxPadding <= 0) continue

            checked++
            if (maxPadding <= parentGap.value) {
              passed++
            } else {
              c.addViolation(this.id, child, `Container padding (${maxPadding}px) exceeds parent gap (${parentGap.value}px)`, `padding ≤ parent gap (${parentGap.value}px)`, `padding: ${maxPadding}px`, this.severity)
            }
          }
        }
        return { checked, passed }
      },
    },

    // ── depth-inversion ──
    {
      id: 'depth-inversion',
      severity: 'error',
      run(c) {
        const containers = c.root.querySelectorAll('[role="list"], [role="listbox"], [role="grid"], [role="tree"], [role="tablist"], [role="menu"], [role="toolbar"], [role="group"], ul, ol, nav, section, article, main, div')
        let checked = 0, passed = 0

        for (const container of containers) {
          if (c.shouldSkip(container)) continue
          const containerGap = c.getEffectiveGap(container)
          if (containerGap.value <= 0) continue

          const nested = container.querySelectorAll('[role="list"], [role="listbox"], [role="grid"], [role="tree"], [role="group"], ul, ol, div')
          for (const child of nested) {
            if (child === container) continue
            if (c.shouldSkip(child)) continue
            const childGap = c.getEffectiveGap(child)
            if (childGap.value <= 0) continue

            checked++
            if (childGap.value <= containerGap.value) {
              passed++
            } else {
              c.addViolation(this.id, child, `Child gap (${childGap.value}px) exceeds parent gap (${containerGap.value}px)`, `child gap ≤ parent gap (${containerGap.value}px)`, `child gap: ${childGap.value}px`, this.severity)
            }
          }
        }
        return { checked, passed }
      },
    },

    // ── alignment-axis-overflow ──
    {
      id: 'alignment-axis-overflow',
      severity: 'warning',
      run(c) {
        const GRID = 8
        const THRESHOLD_RATIO = 0.4
        const xCoords = new Set()
        let elementCount = 0
        const SHELL = 'nav, header, [role="navigation"], [role="banner"], [class*="sidebar"], [class*="Sidebar"], [class*="activityBar"], [class*="ActivityBar"]'
        const candidates = c.root.querySelectorAll('[role], button, a, input, select, textarea, label, span, p, h1, h2, h3, h4, h5, h6, li, td, th, img')

        for (const el of candidates) {
          if (el.closest(SHELL)) continue
          if (c.shouldSkip(el)) continue
          const rect = el.getBoundingClientRect()
          if (rect.width > 800 && rect.height > 600) continue
          elementCount++
          xCoords.add(Math.round(rect.left / GRID) * GRID)
        }

        if (elementCount < 10) return { checked: 0, passed: 0 }
        const ratio = xCoords.size / elementCount
        if (ratio <= THRESHOLD_RATIO) return { checked: 1, passed: 1 }

        c.addViolation(this.id, c.root, `${xCoords.size} unique X positions for ${elementCount} elements (ratio: ${ratio.toFixed(3)})`, `ratio ≤ ${THRESHOLD_RATIO}`, `ratio: ${ratio.toFixed(3)}`, this.severity)
        return { checked: 1, passed: 0 }
      },
    },

    // ── decoration-overload ──
    {
      id: 'decoration-overload',
      severity: 'warning',
      run(c) {
        const THRESHOLD = 2
        const DECO = [
          { prop: 'borderWidth', none: ['0px', '0px 0px 0px 0px'] },
          { prop: 'boxShadow', none: ['none', ''] },
          { prop: 'backgroundColor', none: ['rgba(0, 0, 0, 0)', 'transparent', ''] },
        ]
        const candidates = c.root.querySelectorAll('[role], button, a, input, select, textarea, [class]')
        let checked = 0, passed = 0

        for (const el of candidates) {
          if (c.shouldSkip(el)) continue
          if (el.closest('[role="switch"]')) continue

          const style = getComputedStyle(el)
          let count = 0
          const active = []
          for (const { prop, none } of DECO) {
            const value = style[prop]
            if (value && !none.includes(value)) { count++; active.push(`${prop}=${value}`) }
          }
          if (count === 0) continue
          checked++
          if (count <= THRESHOLD) {
            passed++
          } else {
            c.addViolation(this.id, el, `${count} simultaneous decorations (max ${THRESHOLD})`, `≤ ${THRESHOLD} decorations`, active.join(', '), this.severity)
          }
        }
        return { checked, passed }
      },
    },

    // ── same-role-different-spacing ──
    {
      id: 'same-role-different-spacing',
      severity: 'warning',
      run(c) {
        const roleMap = new Map()
        const SKIP_ROLES = ['presentation', 'none', 'group', 'region']

        for (const el of c.root.querySelectorAll('[role]')) {
          if (c.shouldSkip(el)) continue
          const role = el.getAttribute('role')
          if (!role || SKIP_ROLES.includes(role)) continue

          const style = getComputedStyle(el)
          const padding = `${Math.round(c.parseSpacing(style, 'paddingTop'))}/${Math.round(c.parseSpacing(style, 'paddingRight'))}/${Math.round(c.parseSpacing(style, 'paddingBottom'))}/${Math.round(c.parseSpacing(style, 'paddingLeft'))}`

          if (!roleMap.has(role)) roleMap.set(role, { paddings: new Set(), elements: [] })
          const entry = roleMap.get(role)
          entry.paddings.add(padding)
          entry.elements.push(el)
        }

        let checked = 0, passed = 0
        for (const [role, { paddings, elements }] of roleMap) {
          if (elements.length < 2) continue
          checked++
          if (paddings.size <= 1) {
            passed++
          } else {
            c.addViolation(this.id, elements[0], `role="${role}" has ${paddings.size} different padding patterns across ${elements.length} elements`, 'consistent padding for same role', [...paddings].join(' vs '), this.severity)
          }
        }
        return { checked, passed }
      },
    },

    // ── touch-target-too-small ──
    {
      id: 'touch-target-too-small',
      severity: 'error',
      run(c) {
        const MIN = 44
        const candidates = c.root.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], [role="radio"], [role="checkbox"], [role="switch"], [role="slider"], [role="spinbutton"], [role="combobox"], [role="treeitem"]')
        let checked = 0, passed = 0

        for (const el of candidates) {
          if (c.shouldSkip(el)) continue
          if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue
          const rect = el.getBoundingClientRect()
          checked++
          if (rect.width >= MIN && rect.height >= MIN) {
            passed++
          } else {
            c.addViolation(this.id, el, `Interactive element is ${Math.round(rect.width)}×${Math.round(rect.height)}px`, `≥ ${MIN}×${MIN}px`, `${Math.round(rect.width)}×${Math.round(rect.height)}px`, this.severity)
          }
        }
        return { checked, passed }
      },
    },

    // ── focus-no-feedback ──
    {
      id: 'focus-no-feedback',
      severity: 'warning',
      run(c) {
        const candidates = c.root.querySelectorAll('button, a[href], input, select, textarea, [role="button"], [role="link"], [role="tab"], [role="menuitem"], [role="option"], [role="radio"], [role="checkbox"], [role="switch"], [role="treeitem"]')
        let checked = 0, passed = 0
        const previousFocus = document.activeElement
        const COMPARE = ['outline', 'outlineColor', 'outlineWidth', 'outlineStyle', 'boxShadow', 'backgroundColor', 'borderColor']

        for (const el of candidates) {
          if (c.shouldSkip(el)) continue
          if (el.disabled || el.getAttribute('aria-disabled') === 'true') continue
          if (checked >= 20) break

          const beforeStyle = getComputedStyle(el)
          const before = {}
          for (const p of COMPARE) before[p] = beforeStyle[p]

          el.focus({ preventScroll: true })

          const afterStyle = getComputedStyle(el)
          let changed = false
          for (const p of COMPARE) { if (before[p] !== afterStyle[p]) { changed = true; break } }

          checked++
          if (changed) {
            passed++
          } else {
            c.addViolation(this.id, el, 'No visual change on focus', 'outline, boxShadow, or backgroundColor change on :focus-visible', 'no computed style diff', this.severity)
          }
        }

        if (previousFocus && typeof previousFocus.focus === 'function') {
          try { previousFocus.focus({ preventScroll: true }) } catch {}
        } else {
          try { document.body.focus({ preventScroll: true }) } catch {}
        }
        return { checked, passed }
      },
    },

    // ── inline-raw-value ──
    // inline style에 디자인 속성의 raw 값이 있으면 위반
    {
      id: 'inline-raw-value',
      severity: 'error',
      run(c) {
        const DESIGN_PROPS = ['color', 'background', 'background-color', 'border', 'border-color', 'border-width', 'border-radius', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'gap', 'row-gap', 'column-gap', 'font-size', 'font-weight', 'font-family', 'line-height', 'box-shadow', 'outline', 'outline-color', 'outline-width', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height']

        function isExempt(value) {
          const v = value.trim()
          if (/^var\(--/.test(v)) return true
          if (/^calc\(/.test(v) && /var\(--/.test(v)) return true
          const SAFE = ['0', '0px', '0%', 'none', 'inherit', 'initial', 'unset', 'revert', 'transparent', 'currentColor', 'currentcolor', 'auto', 'normal', '100%', '50%']
          if (SAFE.includes(v)) return true
          if (/^-?\d+(\.\d+)?$/.test(v)) return true  // unitless (font-weight, line-height, flex)
          if (v === '1px' || v === '-1px') return true
          return false
        }

        const all = c.root.querySelectorAll('*')
        let checked = 0, passed = 0

        for (const el of all) {
          if (!el.style || el.style.length === 0) continue
          if (c.shouldSkip(el)) continue

          let hasDesignProp = false
          let hasViolation = false
          const rawProps = []

          for (const prop of DESIGN_PROPS) {
            const value = el.style.getPropertyValue(prop)
            if (!value) continue
            hasDesignProp = true
            if (!isExempt(value)) {
              hasViolation = true
              rawProps.push(`${prop}: ${value}`)
            }
          }

          if (!hasDesignProp) continue
          checked++

          if (!hasViolation) {
            passed++
          } else {
            c.addViolation(this.id, el, `Inline style with raw design values`, 'var(--token) or exempt value', rawProps.slice(0, 3).join('; ') + (rawProps.length > 3 ? ` (+${rawProps.length - 3} more)` : ''), this.severity)
          }
        }
        return { checked, passed }
      },
    },

    // ── stylesheet-raw-value ──
    // 같은 origin stylesheet에서 디자인 속성에 raw 값이 있으면 위반
    {
      id: 'stylesheet-raw-value',
      severity: 'warning',
      run(c) {
        const DESIGN_PROPS = ['color', 'background', 'background-color', 'border', 'border-color', 'border-width', 'border-radius', 'padding', 'padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'gap', 'row-gap', 'column-gap', 'font-size', 'font-weight', 'font-family', 'line-height', 'box-shadow', 'outline', 'outline-color', 'outline-width', 'width', 'height', 'min-width', 'min-height', 'max-width', 'max-height']

        function isExempt(value) {
          const v = value.trim()
          if (/^var\(--/.test(v)) return true
          if (/^calc\(/.test(v) && /var\(--/.test(v)) return true
          const SAFE = ['0', '0px', '0%', 'none', 'inherit', 'initial', 'unset', 'revert', 'transparent', 'currentColor', 'currentcolor', 'auto', 'normal', '100%', '50%']
          if (SAFE.includes(v)) return true
          if (/^-?\d+(\.\d+)?$/.test(v)) return true
          if (v === '1px' || v === '-1px') return true
          return false
        }

        function parseShorthand(value) {
          const parts = []
          let depth = 0, current = ''
          for (const ch of value) {
            if (ch === '(') depth++
            if (ch === ')') depth--
            if (ch === ' ' && depth === 0) { if (current.trim()) parts.push(current.trim()); current = '' }
            else current += ch
          }
          if (current.trim()) parts.push(current.trim())
          return parts
        }

        let checked = 0, passed = 0

        for (const sheet of document.styleSheets) {
          let rules
          try { rules = sheet.cssRules || sheet.rules } catch { continue } // cross-origin skip

          for (const rule of rules) {
            if (rule.type !== 1) continue // CSSStyleRule only
            const style = rule.style
            if (!style) continue

            // Skip reset/normalize layers
            const selector = rule.selectorText || ''
            if (selector === '*' || selector === 'html' || selector === 'body' || selector.startsWith(':root') || selector.startsWith(':where')) continue

            let hasDesignProp = false
            let hasViolation = false
            const rawProps = []

            for (const prop of DESIGN_PROPS) {
              const value = style.getPropertyValue(prop)
              if (!value) continue
              hasDesignProp = true

              // Check shorthand parts individually
              const parts = parseShorthand(value)
              for (const part of parts) {
                if (!isExempt(part)) {
                  // Skip CSS keywords (solid, dashed, sans-serif, etc.)
                  if (/^[a-z-]+$/.test(part) && !/px|em|rem|%|vw|vh/.test(part)) continue
                  hasViolation = true
                  rawProps.push(`${prop}: ${value}`)
                  break
                }
              }
            }

            if (!hasDesignProp) continue
            checked++

            if (!hasViolation) {
              passed++
            } else {
              // Use root as element since CSS rules aren't tied to specific elements
              c.addViolation(this.id, c.root, `Rule "${selector}" has raw design values`, 'var(--token) or exempt value', rawProps.slice(0, 3).join('; ') + (rawProps.length > 3 ? ` (+${rawProps.length - 3} more)` : ''), this.severity)
            }
          }
        }
        return { checked, passed }
      },
    },

  ] // ← 새 규칙은 여기에 객체를 추가하면 됨

  // ════════════════════════════════════════════════════
  // Runner — 불변. 규칙 배열만 순회한다.
  // ════════════════════════════════════════════════════

  const ruleResults = {}
  let totalChecked = 0, totalRules = 0, passedRules = 0

  for (const rule of rules) {
    if (enabledRuleIds && !enabledRuleIds.includes(rule.id)) continue
    const result = rule.run(ctx)
    ruleResults[rule.id] = result
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
      totalRules, passedRules, totalChecked,
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

  const byRule = new Map()
  for (const v of violations) {
    if (!byRule.has(v.rule)) byRule.set(v.rule, [])
    byRule.get(v.rule).push(v)
  }

  for (const [rule, ruleViolations] of byRule) {
    const sev = ruleViolations[0].severity.toUpperCase()
    lines.push(`[${sev}] ${rule} (${ruleViolations.length} violation${ruleViolations.length > 1 ? 's' : ''})`)
    for (const v of ruleViolations.slice(0, 5)) {
      lines.push(`  → ${v.element}`)
      lines.push(`  → ${v.message}`)
      lines.push(`  → Expected: ${v.expected}`)
      lines.push(`  → Actual: ${v.actual}`)
      lines.push('')
    }
    if (ruleViolations.length > 5) { lines.push(`  ... and ${ruleViolations.length - 5} more`); lines.push('') }
  }

  lines.push(`Score: ${summary.score} rules passed`)
  return lines.join('\n')
}

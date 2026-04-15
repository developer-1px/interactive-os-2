/**
 * Design Metrics — 구조적 디자인 품질 메트릭 수집기
 *
 * 모든 메트릭은 브라우저 컨텍스트에서 실행된다.
 * - Playwright page.evaluate()
 * - Claude in Chrome javascript_tool
 * - 브라우저 콘솔
 *
 * 프로젝트 비의존 — 아무 페이지에서 실행 가능.
 *
 * 아키텍처: designLintRules.mjs와 동일한 OCP 패턴.
 * 메트릭 추가 = metrics 배열에 객체 하나 추가. runner 수정 불필요.
 */

/**
 * 전체 메트릭 실행. self-contained — 외부 클로저 참조 없음.
 * page.evaluate(runDesignMetrics) 형태로 사용 가능.
 *
 * @param {Element} [root=document.body]
 * @returns {{ metrics: Record<string, { value: any, normalized: number, details: string }>, summary: { score: number } }}
 */
export function runDesignMetrics(root) {
  if (!root) root = document.body

  // ── Helpers ──

  function isVisible(el) {
    if (!(el instanceof HTMLElement)) return false
    const st = getComputedStyle(el)
    if (st.display === 'none' || st.visibility === 'hidden' || st.opacity === '0') return false
    const r = el.getBoundingClientRect()
    return r.width > 0 && r.height > 0
  }

  function isLeaf(el) {
    if (el.tagName === 'SVG' || el.closest('svg')) return false
    if (el.tagName === 'CANVAS') return false
    const children = el.children
    if (children.length === 0) return true
    // Text nodes with visible text
    const tag = el.tagName
    if (tag === 'IMG' || tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return true
    // Check if it has direct text content
    for (const node of el.childNodes) {
      if (node.nodeType === 3 && node.textContent.trim()) return true
    }
    return children.length === 0
  }

  function getAllVisible(filterFn) {
    const all = root.querySelectorAll('*')
    const result = []
    for (const el of all) {
      if (el.closest('svg') || el.tagName === 'SVG' || el.tagName === 'CANVAS') continue
      if (!isVisible(el)) continue
      if (!filterFn || filterFn(el)) result.push(el)
    }
    return result
  }

  function clamp01(v) {
    return Math.max(0, Math.min(1, v))
  }

  function parsePixelValue(v) {
    if (!v || v === 'normal' || v === 'auto' || v === 'none') return null
    const n = parseFloat(v)
    return isNaN(n) ? null : n
  }

  // ── Metric definitions ──

  const metricDefs = [
    {
      id: 'alignment-score',
      weight: 3,
      run() {
        const leaves = getAllVisible(isLeaf)
        if (leaves.length < 2) return { value: 1, normalized: 1, details: 'Too few elements to measure' }

        const xPositions = new Set()
        for (const el of leaves) {
          const left = el.getBoundingClientRect().left
          const snapped = Math.round(left / 8) * 8
          xPositions.add(snapped)
        }

        const score = clamp01(1 - xPositions.size / leaves.length)
        return {
          value: { uniqueX: xPositions.size, elements: leaves.length },
          normalized: score,
          details: `${xPositions.size} unique X positions (8px grid) across ${leaves.length} leaf elements`,
        }
      },
    },
    {
      id: 'whitespace-fraction',
      weight: 2,
      run() {
        const vpW = window.innerWidth
        const vpH = window.innerHeight
        const vpArea = vpW * vpH
        if (vpArea === 0) return { value: 0, normalized: 0, details: 'No viewport' }

        // Use a pixel-grid approach: divide viewport into cells, mark occupied ones
        const CELL = 16 // 16px grid
        const cols = Math.ceil(vpW / CELL)
        const rows = Math.ceil(vpH / CELL)
        const grid = new Uint8Array(cols * rows)

        const leaves = getAllVisible(isLeaf)
        for (const el of leaves) {
          const r = el.getBoundingClientRect()
          const x0 = Math.max(0, Math.floor(r.left / CELL))
          const y0 = Math.max(0, Math.floor(r.top / CELL))
          const x1 = Math.min(cols - 1, Math.floor(r.right / CELL))
          const y1 = Math.min(rows - 1, Math.floor(r.bottom / CELL))
          for (let y = y0; y <= y1; y++)
            for (let x = x0; x <= x1; x++)
              grid[y * cols + x] = 1
        }

        let occupied = 0
        for (let i = 0; i < grid.length; i++) if (grid[i]) occupied++
        const occupiedArea = occupied * CELL * CELL
        const fraction = clamp01(1 - occupiedArea / vpArea)
        // Ideal 0.3-0.6, midpoint 0.45
        const distance = Math.abs(fraction - 0.45)
        // Max distance from 0.45 is 0.55, normalize so 0 distance = 1.0
        const score = clamp01(1 - distance / 0.55)

        return {
          value: { fraction: Math.round(fraction * 1000) / 1000, elementArea: Math.round(occupiedArea), vpArea },
          normalized: score,
          details: `Whitespace ${(fraction * 100).toFixed(1)}% (ideal 30-60%), ${leaves.length} leaf elements`,
        }
      },
    },
    {
      id: 'visual-complexity',
      weight: 0, // P2 stub, not in summary
      run() {
        const allEls = getAllVisible()
        const fontSizes = new Set()
        const colors = new Set()
        const borders = new Set()

        for (const el of allEls) {
          const st = getComputedStyle(el)
          fontSizes.add(st.fontSize)
          colors.add(st.color)
          colors.add(st.backgroundColor)
          if (st.borderStyle !== 'none') borders.add(st.borderStyle + st.borderWidth + st.borderColor)
        }

        const count = allEls.length
        const complexity = Math.log(Math.max(1, count)) + fontSizes.size + colors.size
        // Normalize: assume complexity > 50 is max
        const score = clamp01(1 - complexity / 50)

        return {
          value: { elements: count, fontSizes: fontSizes.size, colors: colors.size, borders: borders.size, complexity: Math.round(complexity * 10) / 10 },
          normalized: score,
          details: `${count} elements, ${fontSizes.size} font sizes, ${colors.size} colors, ${borders.size} border styles`,
        }
      },
    },
    {
      id: 'proportion-constraint',
      weight: 3,
      run() {
        const allEls = getAllVisible()
        let total = 0
        let constrained = 0

        for (const el of allEls) {
          const st = getComputedStyle(el)
          const r = el.getBoundingClientRect()
          // Only check elements that span most of the viewport width (>80%)
          // and are content containers (not structural wrappers)
          const spansViewport = r.width > window.innerWidth * 0.8
          const tag = el.tagName.toLowerCase()
          const isContentEl = tag === 'img' || tag === 'video' || tag === 'iframe' ||
            tag === 'section' || tag === 'article' || tag === 'main' ||
            (el.getAttribute('role') && !['presentation', 'none', 'group'].includes(el.getAttribute('role')))

          if (!spansViewport || !isContentEl) continue
          total++

          const hasMaxWidth = st.maxWidth !== 'none' && st.maxWidth !== '0px'
          const hasAspectRatio = st.aspectRatio !== 'auto' && st.aspectRatio !== ''
          // Check parent column constraint
          const parent = el.parentElement
          let parentConstrained = false
          if (parent) {
            const pst = getComputedStyle(parent)
            parentConstrained =
              (pst.maxWidth !== 'none' && pst.maxWidth !== '0px') ||
              pst.columnCount !== 'auto' ||
              (pst.display === 'grid' && pst.gridTemplateColumns !== 'none')
          }

          if (hasMaxWidth || hasAspectRatio || parentConstrained) constrained++
        }

        if (total === 0) return { value: 1, normalized: 1, details: 'No flexible-width elements found' }

        const score = clamp01(constrained / total)
        return {
          value: { constrained, total },
          normalized: score,
          details: `${constrained}/${total} flexible elements have constraints (max-width, aspect-ratio, or parent column)`,
        }
      },
    },
    {
      id: 'spacing-rhythm',
      weight: 2,
      run() {
        const allEls = getAllVisible()
        let total = 0
        let onGrid = 0

        const props = [
          'gap', 'rowGap', 'columnGap',
          'paddingTop', 'paddingRight', 'paddingBottom', 'paddingLeft',
          'marginTop', 'marginRight', 'marginBottom', 'marginLeft',
        ]

        for (const el of allEls) {
          const st = getComputedStyle(el)
          for (const prop of props) {
            const v = parsePixelValue(st[prop])
            if (v === null || v === 0) continue
            total++
            if (Math.round(v) % 4 === 0) onGrid++
          }
        }

        if (total === 0) return { value: 1, normalized: 1, details: 'No spacing values found' }

        const score = clamp01(onGrid / total)
        return {
          value: { onGrid, total },
          normalized: score,
          details: `${onGrid}/${total} spacing values on 4px grid (${(score * 100).toFixed(0)}%)`,
        }
      },
    },
  ]

  // ── Runner ──

  const metrics = {}
  for (const def of metricDefs) {
    try {
      metrics[def.id] = def.run()
    } catch (e) {
      metrics[def.id] = { value: null, normalized: 0, details: `Error: ${e.message}` }
    }
  }

  // Weighted average (only metrics with weight > 0)
  let weightSum = 0
  let scoreSum = 0
  for (const def of metricDefs) {
    if (def.weight > 0) {
      weightSum += def.weight
      scoreSum += def.weight * (metrics[def.id]?.normalized ?? 0)
    }
  }

  const summary = { score: weightSum > 0 ? Math.round((scoreSum / weightSum) * 1000) / 1000 : 0 }

  return { metrics, summary }
}

/**
 * LLM-readable 텍스트 리포트 생성.
 *
 * @param {{ metrics: Record<string, { value: any, normalized: number, details: string }>, summary: { score: number } }} result
 * @returns {string}
 */
export function formatMetricsReport(result) {
  const lines = ['=== Design Metrics Report ===', '']

  const weights = { 'alignment-score': 3, 'whitespace-fraction': 2, 'visual-complexity': 0, 'proportion-constraint': 3, 'spacing-rhythm': 2 }

  for (const [id, m] of Object.entries(result.metrics)) {
    const w = weights[id] ?? 0
    const tag = w > 0 ? `w${w}` : 'P2'
    const bar = '█'.repeat(Math.round(m.normalized * 10)) + '░'.repeat(10 - Math.round(m.normalized * 10))
    lines.push(`[${tag}] ${id}: ${(m.normalized * 100).toFixed(0)}% ${bar}`)
    lines.push(`     ${m.details}`)
    lines.push('')
  }

  lines.push(`── Summary Score: ${(result.summary.score * 100).toFixed(1)}% ──`)
  lines.push('Weights: alignment(3) + whitespace(2) + proportion(3) + spacing(2) = 10')

  return lines.join('\n')
}

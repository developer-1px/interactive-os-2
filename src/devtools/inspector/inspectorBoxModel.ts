/**
 * DOM element → BoxModel measurement + text formatting
 * Pure functions extracted from InspectorOverlay.
 */

export interface BoxModel {
  top: number
  left: number
  width: number
  height: number
  marginTop: number
  marginRight: number
  marginBottom: number
  marginLeft: number
  paddingTop: number
  paddingRight: number
  paddingBottom: number
  paddingLeft: number
  borderTop: number
  borderRight: number
  borderBottom: number
  borderLeft: number
  rowGap: number
  colGap: number
  gaps?: Array<{ top: number; left: number; width: number; height: number }>
  borderRadius?: string
  display: string
}

function getVal(val: string): number {
  return parseFloat(val) || 0
}

function computeContentsRect(element: HTMLElement): DOMRect {
  const children = Array.from(element.children)
  let minTop = Infinity, minLeft = Infinity, maxBottom = -Infinity, maxRight = -Infinity
  children.forEach((child) => {
    const r = child.getBoundingClientRect()
    if (r.width === 0 && r.height === 0) return
    minTop = Math.min(minTop, r.top)
    minLeft = Math.min(minLeft, r.left)
    maxBottom = Math.max(maxBottom, r.bottom)
    maxRight = Math.max(maxRight, r.right)
  })
  if (minTop === Infinity) return element.getBoundingClientRect()
  return {
    top: minTop, left: minLeft, bottom: maxBottom, right: maxRight,
    width: maxRight - minLeft, height: maxBottom - minTop,
    x: minLeft, y: minTop, toJSON: () => {},
  } as DOMRect
}

function computeGaps(element: HTMLElement, styles: CSSStyleDeclaration, display: string): BoxModel['gaps'] {
  const isFlex = display === 'flex' || display === 'inline-flex'
  const isGrid = display === 'grid' || display === 'inline-grid'
  const rowGap = getVal(styles.rowGap) || getVal(styles.gap)
  const colGap = getVal(styles.columnGap) || getVal(styles.gap)

  if (!(isFlex || isGrid) || (rowGap <= 0 && colGap <= 0)) return []

  const children = Array.from(element.children) as HTMLElement[]
  if (children.length <= 1) return []

  const gaps: Array<{ top: number; left: number; width: number; height: number }> = []

  for (let i = 0; i < children.length; i++) {
    const current = children[i].getBoundingClientRect()
    for (let j = 0; j < children.length; j++) {
      if (i === j) continue
      const next = children[j].getBoundingClientRect()
      const verticalOverlap = Math.max(0, Math.min(current.bottom, next.bottom) - Math.max(current.top, next.top))
      if (verticalOverlap > 0 && colGap > 0 && next.left > current.right && Math.abs(next.left - current.right - colGap) < 2) {
        gaps.push({
          top: Math.min(current.top, next.top) + window.scrollY,
          left: current.right + window.scrollX,
          width: next.left - current.right,
          height: Math.max(current.height, next.height),
        })
      }
      const horizontalOverlap = Math.max(0, Math.min(current.right, next.right) - Math.max(current.left, next.left))
      if (horizontalOverlap > 0 && rowGap > 0 && next.top > current.bottom && Math.abs(next.top - current.bottom - rowGap) < 2) {
        gaps.push({
          top: current.bottom + window.scrollY,
          left: Math.min(current.left, next.left) + window.scrollX,
          width: Math.max(current.width, next.width),
          height: next.top - current.bottom,
        })
      }
    }
  }

  // Deduplicate
  const distinct: typeof gaps = []
  gaps.forEach((g) => {
    if (!distinct.some((dg) =>
      Math.abs(dg.top - g.top) < 1 && Math.abs(dg.left - g.left) < 1 &&
      Math.abs(dg.width - g.width) < 1 && Math.abs(dg.height - g.height) < 1
    )) {
      distinct.push(g)
    }
  })
  return distinct
}

/** Measure an element's full box model including margins, padding, borders, and gaps. */
export function measureBoxModel(element: HTMLElement): BoxModel {
  const styles = window.getComputedStyle(element)
  const display = styles.display

  let rect = element.getBoundingClientRect()
  if (display === 'contents' && element.children.length > 0) {
    rect = computeContentsRect(element)
  }

  const rowGap = getVal(styles.rowGap) || getVal(styles.gap)
  const colGap = getVal(styles.columnGap) || getVal(styles.gap)

  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height,
    marginTop: getVal(styles.marginTop),
    marginRight: getVal(styles.marginRight),
    marginBottom: getVal(styles.marginBottom),
    marginLeft: getVal(styles.marginLeft),
    paddingTop: getVal(styles.paddingTop),
    paddingRight: getVal(styles.paddingRight),
    paddingBottom: getVal(styles.paddingBottom),
    paddingLeft: getVal(styles.paddingLeft),
    borderTop: getVal(styles.borderTopWidth),
    borderRight: getVal(styles.borderRightWidth),
    borderBottom: getVal(styles.borderBottomWidth),
    borderLeft: getVal(styles.borderLeftWidth),
    rowGap,
    colGap,
    gaps: computeGaps(element, styles, display),
    borderRadius: styles.borderRadius,
    display,
  }
}

/** Format spacing values into compact display strings. */
export function formatSpacing(box: BoxModel): { margin: string; padding: string; gap: string } {
  let margin = ''
  const { marginTop, marginRight, marginBottom, marginLeft } = box
  if (marginTop + marginRight + marginBottom + marginLeft > 0) {
    margin = marginTop === marginRight && marginTop === marginBottom && marginTop === marginLeft
      ? `m: ${marginTop}`
      : `m: ${marginTop} ${marginRight} ${marginBottom} ${marginLeft}`
  }

  let padding = ''
  const { paddingTop, paddingRight, paddingBottom, paddingLeft } = box
  if (paddingTop + paddingRight + paddingBottom + paddingLeft > 0) {
    padding = paddingTop === paddingRight && paddingTop === paddingBottom && paddingTop === paddingLeft
      ? `p: ${paddingTop}`
      : `p: ${paddingTop} ${paddingRight} ${paddingBottom} ${paddingLeft}`
  }

  let gap = ''
  if (box.rowGap > 0 || box.colGap > 0) {
    gap = box.rowGap === box.colGap ? `g: ${box.rowGap}` : `g: ${box.rowGap}/${box.colGap}`
  }

  return { margin, padding, gap }
}

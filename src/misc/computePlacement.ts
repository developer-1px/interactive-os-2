// ② 2026-04-02-inspector-source-preview-prd.md

export interface PlacementOptions {
  anchor: { x: number; y: number }
  content: { width: number; height: number }
  viewport: { width: number; height: number }
  offset?: number
  preferred?: 'right' | 'left' | 'bottom' | 'top'
}

export interface PlacementResult {
  top: number
  left: number
}

export function computePlacement(options: PlacementOptions): PlacementResult {
  const { anchor, content, viewport, offset = 8, preferred = 'right' } = options

  let left: number
  let top: number

  if (preferred === 'right' || preferred === 'left') {
    const rightSpace = viewport.width - anchor.x - offset
    const leftSpace = anchor.x - offset

    if (preferred === 'right') {
      left = rightSpace >= content.width
        ? anchor.x + offset
        : leftSpace >= content.width
          ? anchor.x - offset - content.width
          : anchor.x + offset
    } else {
      left = leftSpace >= content.width
        ? anchor.x - offset - content.width
        : rightSpace >= content.width
          ? anchor.x + offset
          : anchor.x - offset - content.width
    }

    top = anchor.y
  } else {
    const bottomSpace = viewport.height - anchor.y - offset
    const topSpace = anchor.y - offset

    if (preferred === 'bottom') {
      top = bottomSpace >= content.height
        ? anchor.y + offset
        : topSpace >= content.height
          ? anchor.y - offset - content.height
          : anchor.y + offset
    } else {
      top = topSpace >= content.height
        ? anchor.y - offset - content.height
        : bottomSpace >= content.height
          ? anchor.y + offset
          : anchor.y - offset - content.height
    }

    left = anchor.x
  }

  const padding = 8
  left = Math.max(padding, Math.min(left, viewport.width - padding - content.width))
  top = Math.max(padding, Math.min(top, viewport.height - padding - content.height))

  return { top, left }
}

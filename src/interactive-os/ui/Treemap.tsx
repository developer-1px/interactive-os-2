// ② 2026-03-30-birdseye-improve-prd.md
import { useMemo, useCallback } from 'react'
import styles from './Treemap.module.css'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import { getChildren, getEntity } from '../store/createStore'

interface TreemapProps {
  data: NormalizedData
  width: number
  height: number
  onActivate?: (nodeId: string) => void
  'aria-label'?: string
}

interface Rect { x: number; y: number; w: number; h: number }

function layoutStrip(
  items: { id: string; value: number }[],
  bounds: Rect,
  total: number,
): (Rect & { id: string })[] {
  if (items.length === 0 || total === 0) return []
  if (items.length === 1) {
    return [{ ...bounds, id: items[0].id }]
  }

  const { x, y, w, h } = bounds
  const vertical = w >= h

  let stripSum = 0
  let splitIdx = 1

  for (let i = 0; i < items.length - 1; i++) {
    stripSum += items[i].value
    const stripFraction = stripSum / total
    const nextStripSum = stripSum + items[i + 1].value
    const nextFraction = nextStripSum / total

    // Aspect ratio of the strip (closer to 1 = more square)
    const stripRatio = vertical
      ? (w * stripFraction) / h
      : w / (h * stripFraction)
    const nextRatio = vertical
      ? (w * nextFraction) / h
      : w / (h * nextFraction)

    if (Math.abs(stripRatio - 1) <= Math.abs(nextRatio - 1)) {
      splitIdx = i + 1
      break
    }
    splitIdx = i + 2
  }

  // Clamp splitIdx to valid range
  splitIdx = Math.min(splitIdx, items.length)

  const strip = items.slice(0, splitIdx)
  const rest = items.slice(splitIdx)
  const stripTotal = strip.reduce((s, i) => s + i.value, 0)
  const fraction = stripTotal / total

  const rects: (Rect & { id: string })[] = []

  if (vertical) {
    const stripW = w * fraction
    let cy = y
    for (const item of strip) {
      const itemH = h * (item.value / stripTotal)
      rects.push({ id: item.id, x, y: cy, w: stripW, h: itemH })
      cy += itemH
    }
    if (rest.length > 0) {
      rects.push(...layoutStrip(rest, { x: x + stripW, y, w: w - stripW, h }, total - stripTotal))
    }
  } else {
    const stripH = h * fraction
    let cx = x
    for (const item of strip) {
      const itemW = w * (item.value / stripTotal)
      rects.push({ id: item.id, x: cx, y, w: itemW, h: stripH })
      cx += itemW
    }
    if (rest.length > 0) {
      rects.push(...layoutStrip(rest, { x, y: y + stripH, w, h: h - stripH }, total - stripTotal))
    }
  }

  return rects
}

/** Squarified treemap layout */
function squarify(
  items: { id: string; value: number }[],
  bounds: Rect,
): (Rect & { id: string })[] {
  if (items.length === 0) return []
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const total = sorted.reduce((s, i) => s + i.value, 0)
  return layoutStrip(sorted, bounds, total)
}

export function Treemap({ data, width, height, onActivate, 'aria-label': ariaLabel }: TreemapProps) {
  const columns = getChildren(data, ROOT_ID)

  // Flatten all cards across columns into treemap input
  const items = useMemo(() => {
    const result: { id: string; value: number; title: string; ext?: string; colTitle: string }[] = []
    for (const colId of columns) {
      const colEntity = getEntity(data, colId)
      const colTitle = (colEntity?.data as Record<string, unknown>)?.title as string ?? ''
      const cards = getChildren(data, colId)
      for (const cardId of cards) {
        const card = getEntity(data, cardId)
        const cardData = card?.data as Record<string, unknown> | undefined
        const loc = cardData?.loc as number | undefined
        result.push({
          id: cardId,
          value: loc ?? 1,
          title: cardData?.title as string ?? '',
          ext: cardData?.ext as string | undefined,
          colTitle,
        })
      }
    }
    return result
  }, [data, columns])

  const rects = useMemo(
    () => squarify(items, { x: 0, y: 0, w: width, h: height }),
    [items, width, height],
  )

  const itemMap = useMemo(() => new Map(items.map(i => [i.id, i])), [items])

  const handleClick = useCallback((id: string) => { onActivate?.(id) }, [onActivate])

  if (width <= 0 || height <= 0) return null

  return (
    <div
      className={`relative overflow-hidden ${styles.treemap}`}
      style={{ width, height }}
      aria-label={ariaLabel}
      role="group"
    >
      {rects.map(r => {
        const item = itemMap.get(r.id)
        const showLabel = r.w > 60 && r.h > 24
        return (
          <button
            key={r.id}
            className={`absolute overflow-hidden flex-row items-end cursor-pointer ${styles.block}`}
            data-ext={item?.ext}
            style={{ left: r.x, top: r.y, width: r.w, height: r.h }}
            title={`${item?.colTitle} > ${item?.title} (${item?.value}L)`}
            onClick={() => handleClick(r.id)}
          >
            {showLabel && <span className={`overflow-hidden whitespace-nowrap ${styles.blockLabel}`}>{item?.title}</span>}
          </button>
        )
      })}
    </div>
  )
}

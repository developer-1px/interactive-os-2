// ② 2026-03-28-splitpane-resize-prd.md
import React, { useRef, useCallback, Children } from 'react'
import type { PaneSize } from '../store/types'
import styles from './SplitPane.module.css'

export type { PaneSize }

interface SplitPaneProps {
  direction: 'horizontal' | 'vertical'
  sizes: PaneSize[]
  onResize: (sizes: PaneSize[]) => void
  children: React.ReactNode
  minRatio?: number
}

const STEP = 0.02

/** Find the index of the 'flex' entry, falling back to last pane */
function flexIndex(sizes: PaneSize[]): number {
  const idx = sizes.indexOf('flex')
  return idx >= 0 ? idx : sizes.length - 1
}

/** Apply a delta to the panes adjacent to a separator, respecting flex */
function applyDelta(
  sizes: PaneSize[], leftIdx: number, rightIdx: number,
  delta: number, minRatio: number,
): PaneSize[] {
  const newSizes = [...sizes]
  const leftIsFlex = sizes[leftIdx] === 'flex'
  const rightIsFlex = sizes[rightIdx] === 'flex'

  if (leftIsFlex && rightIsFlex) return newSizes

  if (leftIsFlex) {
    const cur = sizes[rightIdx] as number
    newSizes[rightIdx] = Math.max(minRatio, Math.min(1 - minRatio, cur - delta))
  } else if (rightIsFlex) {
    const cur = sizes[leftIdx] as number
    newSizes[leftIdx] = Math.max(minRatio, Math.min(1 - minRatio, cur + delta))
  } else {
    const leftVal = sizes[leftIdx] as number
    const rightVal = sizes[rightIdx] as number
    const pairSum = leftVal + rightVal
    let newLeft = leftVal + delta
    newLeft = Math.max(minRatio, Math.min(pairSum - minRatio, newLeft))
    newSizes[leftIdx] = newLeft
    newSizes[rightIdx] = pairSum - newLeft
  }

  return newSizes
}

export function SplitPane({
  direction,
  sizes,
  onResize,
  children,
  minRatio = 0.1,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const childArray = Children.toArray(children)

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      const isHorizontal = direction === 'horizontal'
      const increaseKey = isHorizontal ? 'ArrowRight' : 'ArrowDown'
      const decreaseKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp'

      const delta =
        e.key === increaseKey ? STEP
        : e.key === decreaseKey ? -STEP
        : e.key === 'Home' ? -(1 - minRatio)
        : e.key === 'End' ? (1 - minRatio)
        : null
      if (delta === null) return

      e.preventDefault()
      onResize(applyDelta(sizes, index, index + 1, delta, minRatio))
    },
    [direction, sizes, onResize, minRatio],
  )

  const handlePointerDown = useCallback(
    (index: number, e: React.PointerEvent) => {
      const container = containerRef.current
      if (!container) return

      const target = e.currentTarget as HTMLElement
      target.setPointerCapture(e.pointerId)

      const rect = container.getBoundingClientRect()
      const isHorizontal = direction === 'horizontal'
      const dimension = isHorizontal ? rect.width : rect.height
      const startPos = isHorizontal ? e.clientX : e.clientY

      const leftIdx = index
      const rightIdx = index + 1
      const leftIsFlex = sizes[leftIdx] === 'flex'
      const rightIsFlex = sizes[rightIdx] === 'flex'

      const panes = container.querySelectorAll<HTMLElement>(`.${styles.pane}`)
      const leftPane = panes[leftIdx]
      const rightPane = panes[rightIdx]

      let latestSizes = sizes

      const onPointerMove = (moveEvent: PointerEvent) => {
        const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY
        const deltaRatio = (currentPos - startPos) / dimension

        latestSizes = applyDelta(sizes, leftIdx, rightIdx, deltaRatio, minRatio)

        // Direct DOM update for smooth drag (bypass React re-render)
        const prop = isHorizontal ? 'width' : 'height'
        if (!leftIsFlex && leftPane) {
          leftPane.style[prop] = `${(latestSizes[leftIdx] as number) * 100}%`
        }
        if (!rightIsFlex && rightPane) {
          rightPane.style[prop] = `${(latestSizes[rightIdx] as number) * 100}%`
          // Override flex:1 on last pane if it's a non-flex fallback
          if (rightIdx === sizes.length - 1) {
            rightPane.style.flex = '0 0 auto'
          }
        }

        if (latestSizes[leftIdx] !== 'flex') {
          target.setAttribute('aria-valuenow', String(Math.round((latestSizes[leftIdx] as number) * 100)))
        }
      }

      const cleanup = () => {
        document.removeEventListener('pointermove', onPointerMove)

        // Reset inline styles so React controls them again
        const prop = isHorizontal ? 'width' : 'height'
        if (leftPane) { leftPane.style[prop] = '' }
        if (rightPane) { rightPane.style[prop] = ''; rightPane.style.flex = '' }

        onResize(latestSizes)
      }

      document.addEventListener('pointermove', onPointerMove)
      // lostpointercapture fires on pointerup, unmount, and programmatic release
      target.addEventListener('lostpointercapture', cleanup, { once: true })
    },
    [direction, sizes, onResize, minRatio],
  )

  // Single child or empty: render directly, no separator
  if (childArray.length <= 1) {
    return <>{childArray[0] ?? null}</>
  }

  const isHorizontal = direction === 'horizontal'
  const separatorOrientation = isHorizontal ? 'vertical' : 'horizontal'
  const fi = flexIndex(sizes)

  const elements: React.ReactNode[] = []

  childArray.forEach((child, i) => {
    const isFlex = i === fi
    const sizeStyle = isFlex
      ? { flex: 1 }
      : isHorizontal
        ? { width: `${(sizes[i] as number) * 100}%` }
        : { height: `${(sizes[i] as number) * 100}%` }

    elements.push(
      <div key={`pane-${i}`} className={styles.pane} style={sizeStyle}>
        {child}
      </div>,
    )

    if (i < childArray.length - 1) {
      const valueNow = sizes[i] === 'flex' ? 0 : Math.round((sizes[i] as number) * 100)
      elements.push(
        <div
          key={`sep-${i}`}
          role="separator"
          aria-orientation={separatorOrientation}
          aria-valuenow={valueNow}
          aria-valuemin={Math.round(minRatio * 100)}
          aria-valuemax={Math.round((1 - minRatio) * 100)}
          aria-label={`Resize pane ${i + 1}`}
          tabIndex={0}
          className={`${styles.separator} ${isHorizontal ? styles.separatorH : styles.separatorV}`}
          data-surface="action"
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPointerDown={(e) => handlePointerDown(i, e)}
        />,
      )
    }
  })

  return (
    <div
      ref={containerRef}
      className={`${isHorizontal ? 'flex-row' : 'flex-col'} ${styles.splitPane}`}
    >
      {elements}
    </div>
  )
}

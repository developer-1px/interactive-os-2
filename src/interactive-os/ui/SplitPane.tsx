// ② 2026-03-26-workspace-containers-prd.md
import React, { useRef, useCallback, Children } from 'react'
import styles from './SplitPane.module.css'

interface SplitPaneProps {
  direction: 'horizontal' | 'vertical'
  sizes: number[]
  onResize: (sizes: number[]) => void
  children: React.ReactNode
  minRatio?: number
}

const STEP = 0.02

export function SplitPane({
  direction,
  sizes,
  onResize,
  children,
  minRatio = 0.1,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const childArray = Children.toArray(children)

  const clampSizes = useCallback(
    (newSizes: number[]): number[] => {
      return newSizes.map((s) => Math.max(minRatio, Math.min(1 - minRatio, s)))
    },
    [minRatio],
  )

  const handleKeyDown = useCallback(
    (index: number, e: React.KeyboardEvent) => {
      const isHorizontal = direction === 'horizontal'
      const increaseKey = isHorizontal ? 'ArrowRight' : 'ArrowDown'
      const decreaseKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp'

      const delta =
        e.key === increaseKey ? STEP
        : e.key === decreaseKey ? -STEP
        : e.key === 'Home' ? minRatio - sizes[index]
        : e.key === 'End' ? (1 - minRatio) - sizes[index]
        : null
      if (delta === null) return

      e.preventDefault()
      const newSizes = [...sizes]
      newSizes[index] = sizes[index] + delta
      newSizes[index + 1] = sizes[index + 1] - delta
      const clamped = clampSizes(newSizes)
      // Re-normalize so the pair sums to the same total
      const pairSum = sizes[index] + sizes[index + 1]
      clamped[index] = Math.max(minRatio, Math.min(pairSum - minRatio, clamped[index]))
      clamped[index + 1] = pairSum - clamped[index]
      onResize(clamped)
    },
    [direction, sizes, onResize, minRatio, clampSizes],
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
      const startRatioLeft = sizes[index]
      const startRatioRight = sizes[index + 1]
      const pairSum = startRatioLeft + startRatioRight

      // Get pane elements for direct DOM updates during drag
      const panes = container.querySelectorAll<HTMLElement>(`.${styles.pane}`)
      const leftPane = panes[index]
      const rightPane = panes[index + 1]

      let currentLeft = startRatioLeft
      let currentRight = startRatioRight

      const onPointerMove = (moveEvent: PointerEvent) => {
        const currentPos = isHorizontal ? moveEvent.clientX : moveEvent.clientY
        const deltaPx = currentPos - startPos
        const deltaRatio = deltaPx / dimension

        let newLeft = startRatioLeft + deltaRatio
        let newRight = startRatioRight - deltaRatio

        // Clamp
        if (newLeft < minRatio) {
          newLeft = minRatio
          newRight = pairSum - minRatio
        }
        if (newRight < minRatio) {
          newRight = minRatio
          newLeft = pairSum - minRatio
        }

        currentLeft = newLeft
        currentRight = newRight

        // Direct DOM update for smooth performance
        if (leftPane) {
          const prop = isHorizontal ? 'width' : 'height'
          leftPane.style[prop] = `${newLeft * 100}%`
        }
        if (rightPane) {
          const prop = isHorizontal ? 'width' : 'height'
          rightPane.style[prop] = `${newRight * 100}%`
          // Remove flex:1 override during drag if it's the last pane
          if (index + 1 === sizes.length - 1) {
            rightPane.style.flex = '0 0 auto'
          }
        }

        // Update aria-valuenow on the separator
        target.setAttribute('aria-valuenow', String(Math.round(currentLeft * 100)))
      }

      const onPointerUp = () => {
        target.releasePointerCapture(e.pointerId)
        document.removeEventListener('pointermove', onPointerMove)
        document.removeEventListener('pointerup', onPointerUp)

        // Reset inline styles so React controls them again
        if (leftPane) {
          leftPane.style.width = ''
          leftPane.style.height = ''
        }
        if (rightPane) {
          rightPane.style.width = ''
          rightPane.style.height = ''
          rightPane.style.flex = ''
        }

        const newSizes = [...sizes]
        newSizes[index] = currentLeft
        newSizes[index + 1] = currentRight
        onResize(newSizes)
      }

      document.addEventListener('pointermove', onPointerMove)
      document.addEventListener('pointerup', onPointerUp)
    },
    [direction, sizes, onResize, minRatio],
  )

  // Single child or empty: render directly, no separator
  if (childArray.length <= 1) {
    return <>{childArray[0] ?? null}</>
  }

  const isHorizontal = direction === 'horizontal'
  const separatorOrientation = isHorizontal ? 'vertical' : 'horizontal'

  const elements: React.ReactNode[] = []

  childArray.forEach((child, i) => {
    const isLast = i === childArray.length - 1
    const sizeStyle = isLast
      ? { flex: 1 }
      : isHorizontal
        ? { width: `${sizes[i] * 100}%` }
        : { height: `${sizes[i] * 100}%` }

    elements.push(
      <div key={`pane-${i}`} className={styles.pane} style={sizeStyle}>
        {child}
      </div>,
    )

    if (!isLast) {
      const valueNow = Math.round(sizes[i] * 100)
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

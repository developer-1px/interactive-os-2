import React, { useRef, useState, useCallback, useMemo, useEffect, Children } from 'react'
import type { PaneSize } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import styles from './SplitPane.module.css'
import { ax } from '@styles/ax'
import { useAria } from '../primitives/useAria'
import { composePattern } from '../pattern/composePattern'
import { key } from '../axis/types'
import { dragResize, startDragResize, keyboardResize, resizeDelta } from '../plugins/dragResize'

export type { PaneSize }

interface SplitPaneProps {
  direction: 'horizontal' | 'vertical'
  sizes: PaneSize[]
  onResize: (sizes: PaneSize[]) => void
  children: React.ReactNode
  minRatio?: number
  /** Pane indices that should NOT scroll (overflow:hidden). Default: all panes scroll. */
  noScroll?: number[]
}

/** Ratio delta per keyboard step */
const STEP = 0.02

/** Find the index of the 'flex' entry, falling back to last pane */
function flexIndex(sizes: PaneSize[]): number {
  const idx = sizes.indexOf('flex')
  return idx >= 0 ? idx : sizes.length - 1
}

/** Apply a ratio delta to the panes adjacent to a separator */
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

function makeSepStore(): NormalizedData {
  return {
    entities: { sep: { id: 'sep' } },
    relationships: { [ROOT_ID]: ['sep'] },
  }
}

interface SplitPaneSeparatorProps {
  index: number
  direction: 'horizontal' | 'vertical'
  currentRatio: number
  minRatio: number
  onKeyDelta: (index: number, delta: number) => void
  onDragStart: (index: number) => void
  onDragMove: (index: number, cumulativeDelta: number) => void
  getContainer: () => HTMLElement | null
}

function SplitPaneSeparator({ index, direction, currentRatio, minRatio, onKeyDelta, onDragStart, onDragMove, getContainer }: SplitPaneSeparatorProps) {
  const isHorizontal = direction === 'horizontal'

  const pattern = useMemo(() => {
    const inc = key(['resize:delta'], () => resizeDelta(STEP))
    const dec = key(['resize:delta'], () => resizeDelta(-STEP))
    const incBig = key(['resize:delta'], () => resizeDelta(STEP * 10))
    const decBig = key(['resize:delta'], () => resizeDelta(-STEP * 10))

    const keyMap: import('../axis/types').KeyMap = isHorizontal
      ? { ArrowRight: inc, ArrowLeft: dec, PageUp: decBig, PageDown: incBig }
      : { ArrowDown: inc, ArrowUp: dec, PageUp: decBig, PageDown: incBig }

    return composePattern(
      { role: 'none', childRole: 'separator' },
      [],
      keyMap,
    )
  }, [isHorizontal])

  // Stable refs so plugins always see latest callbacks
  const onKeyDeltaRef = useRef(onKeyDelta)
  const onDragStartRef = useRef(onDragStart)
  const onDragMoveRef = useRef(onDragMove)
  useEffect(() => {
    onKeyDeltaRef.current = onKeyDelta
    onDragStartRef.current = onDragStart
    onDragMoveRef.current = onDragMove
  })

  const [plugins] = useState(() => [
    dragResize({
      orientation: direction,
      getContainer,
      onDragStart: () => onDragStartRef.current(index),
      onDragMove: (delta) => onDragMoveRef.current(index, delta),
    }),
    keyboardResize({
      onDelta: (delta) => onKeyDeltaRef.current(index, delta),
    }),
  ])

  const initialStore = useMemo(() => makeSepStore(), [])

  const aria = useAria({
    pattern,
    data: initialStore,
    plugins,
    autoFocus: false,
  })

  const nodeProps = aria.getNodeProps('sep')
  const nodeState = aria.getNodeState('sep')
  const valueNow = Math.round(currentRatio * 100)

  return (
    <div
      {...nodeProps as React.HTMLAttributes<HTMLElement>}
      role="separator"
      aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
      aria-valuenow={valueNow}
      aria-valuemin={Math.round(minRatio * 100)}
      aria-valuemax={100 - Math.round(minRatio * 100)}
      aria-label={`Resize pane ${index + 1}`}
      tabIndex={0}
      className={`shrink-0 ${styles.separator} ${isHorizontal ? styles.separatorH : styles.separatorV}`}
      data-surface="action"
      data-focused={nodeState.focused || undefined}
      onPointerDown={(e) => aria.dispatch(startDragResize(e.pointerId, e.currentTarget as HTMLElement, e.clientX, e.clientY))}
    />
  )
}

export function SplitPane({
  direction,
  sizes,
  onResize,
  children,
  minRatio = 0.1,
  noScroll,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const childArray = Children.toArray(children)
  const getContainer = useCallback(() => containerRef.current, [])

  const sizesRef = useRef(sizes)
  useEffect(() => { sizesRef.current = sizes })

  const dragStartSizes = useRef<PaneSize[]>(sizes)

  // Keyboard: incremental delta on current sizes
  const handleKeyDelta = useCallback((sepIndex: number, delta: number) => {
    onResize(applyDelta(sizesRef.current, sepIndex, sepIndex + 1, delta, minRatio))
  }, [onResize, minRatio])

  // Drag: cumulative delta on captured start sizes
  const handleDragStart = useCallback((_sepIndex: number) => {
    dragStartSizes.current = sizesRef.current
  }, [])

  const handleDragMove = useCallback((sepIndex: number, cumulativeDelta: number) => {
    onResize(applyDelta(dragStartSizes.current, sepIndex, sepIndex + 1, cumulativeDelta, minRatio))
  }, [onResize, minRatio])

  if (childArray.length <= 1) {
    return <>{childArray[0] ?? null}</>
  }

  const isHorizontal = direction === 'horizontal'
  const fi = flexIndex(sizes)

  const elements: React.ReactNode[] = []

  childArray.forEach((child, i) => {
    const isFlex = i === fi
    const sizeStyle = isFlex
      ? { flex: 1 }
      : { flex: `0 0 ${(sizes[i] as number) * 100}%` }

    const paneLayout = noScroll?.includes(i) ? 'fill' : 'scroll'
    elements.push(
      <div key={`pane-${i}`} className={ax({ layout: paneLayout })} style={sizeStyle}>
        {child}
      </div>,
    )

    if (i < childArray.length - 1) {
      const currentRatio = sizes[i] === 'flex' ? 0.5 : (sizes[i] as number)
      elements.push(
        <SplitPaneSeparator
          key={`sep-${i}`}
          index={i}
          direction={direction}
          currentRatio={currentRatio}
          minRatio={minRatio}
          onKeyDelta={handleKeyDelta}
          onDragStart={handleDragStart}
          onDragMove={handleDragMove}
          getContainer={getContainer}
        />,
      )
    }
  })

  return (
    <div
      ref={containerRef}
      className={`${isHorizontal ? ax({ layout: 'row' }) : ax({ layout: 'column' })} flex-1 min-w-0 min-h-0 overflow-hidden`}
    >
      {elements}
    </div>
  )
}

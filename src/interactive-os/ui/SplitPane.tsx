import React, { useRef, useState, useCallback, useMemo, useEffect, Children } from 'react'
import type { PaneSize } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import styles from './SplitPane.module.css'
import { ax } from '@styles/ax'
import { useAria } from '../primitives/useAria'
import { windowSplitter } from '../pattern/roles/windowSplitter'
import { VALUE_ID } from '../axis/value'
import { dragResize, startDragResize, registerDragCallback, unregisterDragCallback } from '../plugins/dragResize'

export type { PaneSize }

interface SplitPaneProps {
  direction: 'horizontal' | 'vertical'
  sizes: PaneSize[]
  onResize: (sizes: PaneSize[]) => void
  children: React.ReactNode
  minRatio?: number
}

// value axis range: STEP=2 out of 100 = 0.02 ratio step (matches original)
const STEP = 2
const VALUE_MIN = 0
const VALUE_MAX = 100

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
    entities: {
      sep: { id: 'sep' },
      [VALUE_ID]: { id: VALUE_ID, value: VALUE_MAX / 2, min: VALUE_MIN, max: VALUE_MAX, step: STEP },
    },
    relationships: { [ROOT_ID]: ['sep'] },
  }
}

interface SplitPaneSeparatorProps {
  index: number
  direction: 'horizontal' | 'vertical'
  currentRatio: number
  minRatio: number
  onDelta: (index: number, delta: number) => void
  getContainer: () => HTMLElement | null
}

function SplitPaneSeparator({ index, direction, currentRatio, minRatio, onDelta, getContainer }: SplitPaneSeparatorProps) {
  const isHorizontal = direction === 'horizontal'
  const range = useMemo(() => ({ min: VALUE_MIN, max: VALUE_MAX, step: STEP }), [])

  // For vertical: APG says ArrowUp=increment, but SplitPane needs ArrowDown=grow top pane
  // So we swap the key bindings for vertical orientation
  const pattern = useMemo(() => {
    const p = windowSplitter({ min: VALUE_MIN, max: VALUE_MAX, step: STEP, orientation: direction })
    if (!isHorizontal) {
      const km = { ...p.keyMap }
      const up = km['ArrowUp']
      const down = km['ArrowDown']
      km['ArrowDown'] = up!
      km['ArrowUp'] = down!
      return { ...p, keyMap: km }
    }
    return p
  }, [direction, isHorizontal])

  const callbackKey = `splitpane-sep-${index}`
  useEffect(() => {
    registerDragCallback(callbackKey, (delta) => onDelta(index, delta))
    return () => unregisterDragCallback(callbackKey)
  })

  const [plugin] = useState(() => dragResize({
    orientation: direction,
    range,
    getContainer,
    callbackKey,
  }))

  const initialStore = useMemo(() => makeSepStore(), [])

  const aria = useAria({
    pattern,
    data: initialStore,
    plugins: [plugin],
    autoFocus: false,
  })

  const nodeProps = aria.getNodeProps('sep')
  const nodeState = aria.getNodeState('sep')
  const valueNow = Math.round(currentRatio * VALUE_MAX)

  return (
    <div
      {...nodeProps as React.HTMLAttributes<HTMLElement>}
      role="separator"
      aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
      aria-valuenow={valueNow}
      aria-valuemin={Math.round(minRatio * VALUE_MAX)}
      aria-valuemax={VALUE_MAX - Math.round(minRatio * VALUE_MAX)}
      aria-label={`Resize pane ${index + 1}`}
      tabIndex={0}
      className={`shrink-0 ${styles.separator} ${isHorizontal ? styles.separatorH : styles.separatorV}`}
      data-surface="action"
      data-focused={nodeState.focused || undefined}
      onPointerDown={(e) => aria.dispatch(startDragResize(e.pointerId, e.currentTarget as HTMLElement))}
    />
  )
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
  const getContainer = useCallback(() => containerRef.current, [])

  const sizesRef = useRef(sizes)
  useEffect(() => { sizesRef.current = sizes })

  const handleDelta = useCallback((sepIndex: number, delta: number) => {
    onResize(applyDelta(sizesRef.current, sepIndex, sepIndex + 1, delta, minRatio))
  }, [onResize, minRatio])

  // Single child or empty: render directly, no separator
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

    elements.push(
      <div key={`pane-${i}`} className={ax({ layout: 'fill' })} style={sizeStyle}>
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
          onDelta={handleDelta}
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

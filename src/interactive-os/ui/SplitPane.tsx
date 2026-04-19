/** @catalog 리사이즈 가능한 분할 패널 */
import React, { useRef, useState, useCallback, useMemo, useEffect, Children } from 'react'
import type { PaneSize } from '../store/types'
import { ROOT_ID } from '../store/types'
import type { NormalizedData } from '../store/types'
import './SplitPane.css'
import { ax } from '@styles/ax'
import { useAria } from '../primitives/useAria'
import { composePattern } from '../pattern/composePattern'
import { key, type KeyMap } from '../axis/types'
import { dragResize, startDragResize, keyboardResize, resizeDelta } from '../plugins/dragResize'

export type { PaneSize }

interface SplitPaneProps {
  direction: 'horizontal' | 'vertical'
  sizes: PaneSize[]
  onResize: (sizes: PaneSize[]) => void
  children: React.ReactNode
  minRatio?: number
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

    const keyMap: KeyMap = isHorizontal
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

  // eslint-disable-next-line react-hooks/refs
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
      role="separator"
      aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
      aria-valuenow={valueNow}
      aria-valuemin={Math.round(minRatio * 100)}
      aria-valuemax={100 - Math.round(minRatio * 100)}
      aria-label={`Resize pane ${index + 1}`}
      className={`${ax({
          role: 'control',
        surface: 'action', placement: 'relative', flex: 'none' })} bg-transparent ${isHorizontal ? 'cursor-col-resize split-sep-h' : 'cursor-row-resize split-sep-v'}`}
      data-focused={nodeState.focused || undefined}
      onKeyDown={(e) => {
        if (e.currentTarget !== document.activeElement) return
        const np = nodeProps as Record<string, unknown>
        if (typeof np.onKeyDown === 'function') (np.onKeyDown as (e: unknown) => void)(e)
      }}
      onPointerDown={(e) => {
        const el = e.currentTarget as HTMLElement
        el.setAttribute('tabindex', '-1')
        el.focus()
        aria.dispatch(startDragResize(e.pointerId, el, e.clientX, e.clientY))
      }}
      onBlur={(e) => {
        (e.currentTarget as HTMLElement).removeAttribute('tabindex')
      }}
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

  if (childArray.length === 0) return null

  const isHorizontal = direction === 'horizontal'
  const fi = flexIndex(sizes)

  const elements: React.ReactNode[] = []

  // 1개만 보이더라도 동일한 wrapper 구조를 유지한다. Fragment shortcut을 쓰면
  // sibling이 hidden→visible로 바뀌는 순간 DOM 구조(Fragment→div)가 달라져
  // 첫 번째 pane의 React subtree 전체가 리마운트되며 내부 상태(예: tree expand)가 소실된다.
  childArray.forEach((child, i) => {
    const isFlex = i === fi
    const sizeStyle = isFlex
      ? { flex: 1 }
      : { flex: `0 0 ${(sizes[i] as number) * 100}%` }

    elements.push(
      // pane은 overflow:visible (layout:'stack' 기본) — island shadow가 pane 경계 밖으로 펴질 수 있게.
      // 내부 widget은 스스로 scroll을 관리한다.
      <div key={`pane-${i}`} className={ax({ layout: 'stack' })} style={sizeStyle}>
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
      className={isHorizontal ? ax({ layout: 'row-fill' }) : ax({ layout: 'fill' })}
    >
      {elements}
    </div>
  )
}

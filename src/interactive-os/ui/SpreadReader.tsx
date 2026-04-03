import { useState, useCallback, useRef, useLayoutEffect, useMemo, type ReactNode } from 'react'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { ax } from '@styles/ax'
import styles from './SpreadReader.module.css'

interface SpreadReaderProps {
  children: ReactNode
  /** Reset spread when this key changes (e.g. file path) */
  resetKey?: string
  /** Called when ArrowRight at last spread */
  onNextBoundary?: () => void
  /** Called when ArrowLeft at first spread */
  onPrevBoundary?: () => void
  /** Report spread changes to parent */
  onSpreadChange?: (spread: number, total: number) => void
  /** Jump to last spread on mount/reset */
  initialSpread?: 'first' | 'last'
}

export function SpreadReader({ children, resetKey, onNextBoundary, onPrevBoundary, onSpreadChange, initialSpread = 'first' }: SpreadReaderProps) {
  const [spread, setSpread] = useState(0)
  const [totalSpreads, setTotalSpreads] = useState(1)
  const columnsRef = useRef<HTMLDivElement>(null)

  const measureSpreads = useCallback(() => {
    const el = columnsRef.current
    if (!el) return 1
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    return Math.max(1, Math.ceil((el.scrollWidth + gap) / (el.clientWidth + gap)))
  }, [])

  useLayoutEffect(() => {
    const total = measureSpreads()
    const s = initialSpread === 'last' ? total - 1 : 0
    setTotalSpreads(total) // eslint-disable-line react-hooks/set-state-in-effect -- layout measurement requires synchronous setState
    setSpread(s)
    onSpreadChange?.(s, total)
  }, [resetKey, measureSpreads, initialSpread]) // eslint-disable-line react-hooks/exhaustive-deps

  useLayoutEffect(() => {
    const el = columnsRef.current
    if (!el || spread < 0) return
    el.style.setProperty('--_spread', String(spread))
  }, [spread])

  const keyMap = useMemo(() => ({
    ArrowRight: () => {
      if (spread < totalSpreads - 1) {
        const next = spread + 1
        setSpread(next)
        onSpreadChange?.(next, totalSpreads)
      } else {
        onNextBoundary?.()
      }
    },
    ArrowLeft: () => {
      if (spread > 0) {
        const prev = spread - 1
        setSpread(prev)
        onSpreadChange?.(prev, totalSpreads)
      } else {
        onPrevBoundary?.()
      }
    },
  }), [totalSpreads, spread, onNextBoundary, onPrevBoundary, onSpreadChange])

  return (
    <AriaRoute keyMap={keyMap}>
      <div className={styles.root}>
        <div className={styles.inset}>
          <div className={styles.viewport} tabIndex={0}>
            <div className={styles.columns} ref={columnsRef}>
              {children}
            </div>
          </div>
        </div>
        {totalSpreads > 1 && (
          <div className={styles.indicator}>
            <span className={ax({ textStyle: 'caption', text: 'muted' })}>
              {spread + 1}/{totalSpreads}
            </span>
          </div>
        )}
      </div>
    </AriaRoute>
  )
}

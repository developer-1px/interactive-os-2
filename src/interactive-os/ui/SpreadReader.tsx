// ② 2026-04-03-command-unification-prd.md
import { useState, useCallback, useRef, useLayoutEffect, useMemo, type ReactNode } from 'react'
import { composePattern } from '../pattern/composePattern'
import { navigate } from '../axis/navigate'
import { useAria } from '../primitives/useAria'
import { createSequentialStore } from '../store/createSingleNodeStore'
import { FOCUS_ID } from '../axis/navigate'
import type { NormalizedData } from '../store/types'
import { key } from '../axis/types'
import { ax } from '@styles/ax'
import styles from './SpreadReader.module.css'

const nav = navigate('activedescendant')

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
  const columnsRef = useRef<HTMLDivElement>(null)
  const [total, setTotal] = useState(1)

  // Boundary callbacks stored in ref for stable pattern reference
  const callbacksRef = useRef({ onNextBoundary, onPrevBoundary, onSpreadChange })
  useLayoutEffect(() => {
    callbacksRef.current = { onNextBoundary, onPrevBoundary, onSpreadChange }
  })

  // Measure spreads in layout effect
  useLayoutEffect(() => {
    const el = columnsRef.current
    if (!el) return
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0
    const measured = Math.max(1, Math.ceil((el.scrollWidth + gap) / (el.clientWidth + gap)))
    setTotal(measured)
  }, [resetKey])

  // Build pattern with boundary-aware keyMap (stable — uses ref for callbacks)
  /* eslint-disable react-hooks/refs -- ref accessed in event handler closures, not during render */
  const spreadPattern = useMemo(() => composePattern(
    { role: 'none', childRole: 'none' },
    [nav],
    {
      ArrowRight: key(['core:focus'], (ctx) => {
        const cmd = nav.next(ctx)
        if (cmd && (cmd.payload as { nodeId?: string })?.nodeId === ctx.focused) {
          callbacksRef.current.onNextBoundary?.()
          return
        }
        return cmd
      }),
      ArrowLeft: key(['core:focus'], (ctx) => {
        const cmd = nav.prev(ctx)
        if (cmd && (cmd.payload as { nodeId?: string })?.nodeId === ctx.focused) {
          callbacksRef.current.onPrevBoundary?.()
          return
        }
        return cmd
      }),
      Home: nav.first,
      End: nav.last,
    },
  ), [])
  /* eslint-enable react-hooks/refs */

  // Build NormalizedData from measured total
  const data: NormalizedData = useMemo(() => {
    const store = createSequentialStore('spread', total)
    const initial = initialSpread === 'last' ? `spread-${total - 1}` : 'spread-0'
    return {
      ...store,
      entities: {
        ...store.entities,
        [FOCUS_ID]: { id: FOCUS_ID, focusedId: initial },
      },
    }
  }, [total, resetKey, initialSpread]) // eslint-disable-line react-hooks/exhaustive-deps

  const onFocusChange = useCallback((nodeId: string | null) => {
    if (!nodeId) return
    const match = nodeId.match(/^spread-(\d+)$/)
    if (!match) return
    const idx = parseInt(match[1]!, 10)
    callbacksRef.current.onSpreadChange?.(idx, total)

    // Set CSS variable for transform
    const el = columnsRef.current
    if (el) el.style.setProperty('--_spread', String(idx))
  }, [total])

  const aria = useAria({
    pattern: spreadPattern,
    data,
    onFocusChange,
    autoFocus: false,
  })

  // Derive spread index from focused node
  const spreadIndex = useMemo(() => {
    const match = aria.focused.match(/^spread-(\d+)$/)
    return match ? parseInt(match[1]!, 10) : 0
  }, [aria.focused])

  // Set initial CSS variable
  useLayoutEffect(() => {
    const el = columnsRef.current
    if (el) el.style.setProperty('--_spread', String(spreadIndex))
  }, [spreadIndex])

  return (
    <div className={styles.root}>
      <div className={`${ax({ flex: '1' })} ${styles.inset}`}>
        <div className={styles.viewport} {...aria.containerProps}>
          <div className={styles.columns} ref={columnsRef}>
            {children}
          </div>
        </div>
      </div>
      {total > 1 && (
        <div className={styles.indicator}>
          <span className={ax({ textStyle: 'caption', text: 'muted' })}>
            {spreadIndex + 1}/{total}
          </span>
        </div>
      )}
    </div>
  )
}

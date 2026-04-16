/** @catalog 특정 Rect 영역을 줌인/줌아웃하는 컨테이너 */
import { type ReactNode, type CSSProperties, useCallback, useRef, useImperativeHandle, forwardRef } from 'react'
import { ax } from '@styles/ax'

// ── Types ──

export interface ZoomRect {
  /** Target element's top offset within the container (px) */
  top: number
  /** Target element's left offset within the container (px) */
  left: number
  /** Target element's width (px) */
  width: number
  /** Target element's height (px) */
  height: number
}

export interface ZoomPaneHandle {
  /** Zoom into a specific rect area */
  zoomTo: (rect: ZoomRect, scale?: number) => void
  /** Zoom into a line number (code viewer convenience) */
  zoomToLine: (line: number, scale?: number) => void
  /** Reset zoom to 1x */
  reset: () => void
}

interface ZoomPaneProps {
  children: ReactNode
  /** Transition duration in ms (default: 400) */
  duration?: number
  className?: string
}

// ── Component ──

export const ZoomPane = forwardRef<ZoomPaneHandle, ZoomPaneProps>(
  function ZoomPane({ children, duration = 400, className }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const innerRef = useRef<HTMLDivElement>(null)
    const stateRef = useRef<{ originX: string; originY: string; scale: number } | null>(null)

    const applyTransform = useCallback((origin: { originX: string; originY: string } | null, scale: number, dur: number) => {
      const el = innerRef.current
      if (!el) return
      const ox = origin?.originX ?? stateRef.current?.originX ?? '0px'
      const oy = origin?.originY ?? stateRef.current?.originY ?? '0px'
      el.style.transition = `transform ${dur}ms cubic-bezier(0.4, 0, 0.2, 1), transform-origin ${dur}ms cubic-bezier(0.4, 0, 0.2, 1)`
      el.style.transformOrigin = `${ox} ${oy}`
      el.style.transform = `scale(${scale})`
      stateRef.current = { originX: ox, originY: oy, scale }
    }, [])

    /** Scroll to center a line, resolve when scroll settles (scrollend + rAF-idle fallback + 500ms safety). */
    const scrollToLineAwait = useCallback((lineEl: Element): Promise<void> => {
      const container = containerRef.current
      if (!container) return Promise.resolve()
      const containerRect = container.getBoundingClientRect()
      const lineRect = lineEl.getBoundingClientRect()
      const lineCenter = lineRect.top - containerRect.top + container.scrollTop + lineRect.height / 2
      const targetScroll = Math.max(0, lineCenter - containerRect.height / 2)

      // Already at target — no scroll needed
      if (Math.abs(container.scrollTop - targetScroll) < 1) return Promise.resolve()

      return new Promise<void>((resolve) => {
        let settled = false
        const finish = () => {
          if (settled) return
          settled = true
          container.removeEventListener('scrollend', onScrollEnd)
          clearTimeout(safety)
          resolve()
        }
        const onScrollEnd = () => finish()

        // Prefer native scrollend (Chrome 114+, Safari 17+)
        container.addEventListener('scrollend', onScrollEnd, { once: true })

        // Fallback: consecutive rAF ticks with no scrollTop change = settled
        let lastTop = container.scrollTop
        let still = 0
        const poll = () => {
          if (settled) return
          const now = container.scrollTop
          if (Math.abs(now - lastTop) < 0.5) {
            still++
            if (still >= 3 && Math.abs(now - targetScroll) < 1) { finish(); return }
          } else {
            still = 0
            lastTop = now
          }
          requestAnimationFrame(poll)
        }
        requestAnimationFrame(poll)

        // Ultimate safety — smooth scroll typically 300-500ms
        const safety = setTimeout(finish, 600)

        container.scrollTo({ top: targetScroll, behavior: 'smooth' })
      })
    }, [])

    const zoomTo = useCallback((rect: ZoomRect, scale = 1.5) => {
      applyTransform({ originX: `${rect.left}px`, originY: `${rect.top + rect.height / 2}px` }, scale, duration)
    }, [applyTransform, duration])

    const zoomToLine = useCallback((line: number, scale = 1.5) => {
      const container = containerRef.current
      if (!container) {
        applyTransform({ originX: '0px', originY: `calc(${line} * var(--leading-code, 1.5) * 1em)` }, scale, duration)
        return
      }
      const lineEl = container.querySelector(`[data-line="${line}"]`)
      if (!lineEl) {
        applyTransform({ originX: '0px', originY: `calc(${line} * var(--leading-code, 1.5) * 1em)` }, scale, duration)
        return
      }

      // 1) Scroll first, 2) await settlement, 3) then zoom from the final rect
      scrollToLineAwait(lineEl).then(() => {
        // Re-measure after scroll has settled — rect coordinates are now stable
        const c = containerRef.current
        const el = c?.querySelector(`[data-line="${line}"]`)
        if (!c || !el) return
        const cRect = c.getBoundingClientRect()
        const lRect = el.getBoundingClientRect()
        const top = lRect.top - cRect.top + c.scrollTop
        const left = lRect.left - cRect.left + c.scrollLeft
        applyTransform({ originX: `${left}px`, originY: `${top + lRect.height / 2}px` }, scale, duration)
      })
    }, [applyTransform, scrollToLineAwait, duration])

    const reset = useCallback(() => {
      // Keep current origin, just scale back to 1 — no jarring origin jump
      applyTransform(null, 1, duration)
    }, [applyTransform, duration])

    useImperativeHandle(ref, () => ({ zoomTo, zoomToLine, reset }), [zoomTo, zoomToLine, reset])

    const style: CSSProperties = {
      transform: 'scale(1)',
      willChange: 'transform, transform-origin',
    }

    return (
      <div ref={containerRef} className={className ?? ax({ flex: '1', layout: 'scroll', placement: 'relative' })}>
        <div ref={innerRef} style={style}>
          {children}
        </div>
      </div>
    )
  },
)

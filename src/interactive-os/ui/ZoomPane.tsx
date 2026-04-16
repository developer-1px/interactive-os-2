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

    const scrollToLine = useCallback((lineEl: Element) => {
      const container = containerRef.current
      if (!container) return
      const containerRect = container.getBoundingClientRect()
      const lineRect = lineEl.getBoundingClientRect()
      // Calculate target scroll position to center the line
      const lineCenter = lineRect.top - containerRect.top + container.scrollTop + lineRect.height / 2
      const targetScroll = lineCenter - containerRect.height / 2
      container.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' })
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

      const containerRect = container.getBoundingClientRect()
      const lineRect = lineEl.getBoundingClientRect()
      const top = lineRect.top - containerRect.top + container.scrollTop
      const left = lineRect.left - containerRect.left + container.scrollLeft

      // Scroll first, then apply zoom after scroll settles
      scrollToLine(lineEl)
      // Small delay to let scroll start, then apply zoom (they overlap smoothly)
      requestAnimationFrame(() => {
        applyTransform({ originX: `${left}px`, originY: `${top + lineRect.height / 2}px` }, scale, duration)
      })
    }, [applyTransform, scrollToLine, duration])

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

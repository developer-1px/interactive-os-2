/** @catalog 줌/팬 캔버스 — 마우스 휠 줌(포인터 중심) + 트랙패드 팬 + 드래그 팬 */
// Zoom-to-cursor formula from https://phrogz.net/tmp/canvas_zoom_to_cursor.html
// translate(pt) → scale(factor) → translate(-pt)
import { useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import { ax } from '@styles/ax'

export interface ZoomPanCanvasProps {
  children: ReactNode
  initialScale?: number
  className?: string
}

export function ZoomPanCanvas({ children, initialScale, className }: ZoomPanCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const innerRef = useRef<HTMLDivElement>(null)
  const tRef = useRef({ x: 0, y: 0, scale: initialScale ?? 1 })
  const dragging = useRef<{ startX: number; startY: number; tx: number; ty: number } | null>(null)

  const applyTransform = useCallback(() => {
    const el = innerRef.current
    if (!el) return
    const { x, y, scale } = tRef.current
    el.style.transform = `translate(${x}px, ${y}px) scale(${scale})`
  }, [])

  // Center content on mount (once)
  useEffect(() => {
    const container = containerRef.current
    const inner = innerRef.current
    if (!container || !inner) return
    const cr = container.getBoundingClientRect()
    const ir = inner.getBoundingClientRect()
    tRef.current.x = (cr.width - ir.width) / 2
    tRef.current.y = (cr.height - ir.height) / 2
    applyTransform()
  }, [applyTransform])

  // wheel: non-passive to preventDefault
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const t = tRef.current
      if (e.ctrlKey) {
        const rect = el.getBoundingClientRect()
        const mx = e.clientX - rect.left
        const my = e.clientY - rect.top
        const factor = e.deltaY > 0 ? 0.95 : 1.05
        const newScale = Math.min(Math.max(t.scale * factor, 0.1), 10)
        t.x = mx - (mx - t.x) * (newScale / t.scale)
        t.y = my - (my - t.y) * (newScale / t.scale)
        t.scale = newScale
      } else {
        t.x -= e.deltaX
        t.y -= e.deltaY
      }
      applyTransform()
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
  }, [applyTransform])

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.preventDefault()
    const t = tRef.current
    dragging.current = { startX: e.clientX, startY: e.clientY, tx: t.x, ty: t.y }
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging.current) return
    tRef.current.x = dragging.current.tx + (e.clientX - dragging.current.startX)
    tRef.current.y = dragging.current.ty + (e.clientY - dragging.current.startY)
    applyTransform()
  }, [applyTransform])

  const handlePointerUp = useCallback(() => {
    dragging.current = null
  }, [])

  return (
    <div
      ref={containerRef}
      className={`${ax({ scroll: 'hidden' })} ${className ?? ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      style={{ touchAction: 'none', position: 'relative' }}
    >
      <div
        ref={innerRef}
        style={{
          transformOrigin: '0 0',
          transform: `translate(0px, 0px) scale(${initialScale ?? 1})`,
        }}
      >
        {children}
      </div>
    </div>
  )
}

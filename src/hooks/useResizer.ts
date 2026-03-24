import { useState, useCallback, useRef, useEffect } from 'react'

interface UseResizerOptions {
  defaultSize: number
  minSize: number
  maxSize: number
  direction?: 'horizontal' | 'vertical'
  reverse?: boolean
  step?: number
  storageKey?: string
}

function loadSize(key: string | undefined, defaultSize: number, min: number, max: number): number {
  if (!key) return defaultSize
  try {
    const raw = localStorage.getItem(key)
    if (raw == null) return defaultSize
    const v = Number(raw)
    return Number.isFinite(v) ? Math.min(max, Math.max(min, v)) : defaultSize
  } catch { return defaultSize }
}

export function useResizer(options: UseResizerOptions) {
  const { defaultSize, minSize, maxSize, direction = 'horizontal', reverse = false, step = 10, storageKey } = options
  const [size, setSize] = useState(() => loadSize(storageKey, defaultSize, minSize, maxSize))
  const dragging = useRef(false)
  const startPos = useRef(0)
  const startSize = useRef(0)
  const sizeRef = useRef(size)
  const separatorRef = useRef<HTMLElement | null>(null)
  const isHorizontalRef = useRef(direction === 'horizontal')
  const reverseRef = useRef(reverse)

  useEffect(() => { sizeRef.current = size }, [size])
  useEffect(() => { isHorizontalRef.current = direction === 'horizontal' }, [direction])
  useEffect(() => { reverseRef.current = reverse }, [reverse])

  const clamp = useCallback((v: number) => Math.min(maxSize, Math.max(minSize, v)), [minSize, maxSize])

  const persist = useCallback((v: number) => {
    if (storageKey) localStorage.setItem(storageKey, String(v))
  }, [storageKey])

  const commitSize = useCallback((v: number) => {
    const clamped = clamp(v)
    setSize(clamped)
    persist(clamped)
  }, [clamp, persist])

  // pointer handlers on document (move/up)
  // During drag: only ref + DOM direct manipulation (no React re-render).
  // setState only on pointerup.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      if (!dragging.current) return
      const pos = isHorizontalRef.current ? e.clientX : e.clientY
      const rawDelta = pos - startPos.current
      const delta = reverseRef.current ? -rawDelta : rawDelta
      const next = clamp(startSize.current + delta)
      sizeRef.current = next
      // DOM direct manipulation — no React re-render
      const el = separatorRef.current
      if (el) {
        el.setAttribute('aria-valuenow', String(next))
        // Apply size to adjacent panel
        const panel = (reverseRef.current ? el.nextElementSibling : el.previousElementSibling) as HTMLElement | null
        if (panel) {
          if (isHorizontalRef.current) panel.style.width = `${next}px`
          else panel.style.height = `${next}px`
        }
      }
    }
    const onUp = () => {
      if (!dragging.current) return
      dragging.current = false
      // Only commit to React state on pointerup
      commitSize(sizeRef.current)
    }
    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
    return () => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
    }
  }, [clamp, commitSize])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    dragging.current = true
    startPos.current = isHorizontalRef.current ? e.clientX : e.clientY
    startSize.current = sizeRef.current
    separatorRef.current = e.currentTarget as HTMLElement
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    ;(e.currentTarget as HTMLElement).focus()
    e.preventDefault()
  }, [])

  const isHorizontal = direction === 'horizontal'
  const growKey = isHorizontal ? (reverse ? 'ArrowLeft' : 'ArrowRight') : 'ArrowDown'
  const shrinkKey = isHorizontal ? (reverse ? 'ArrowRight' : 'ArrowLeft') : 'ArrowUp'

  const onKeyDown = useCallback((e: React.KeyboardEvent) => {
    switch (e.key) {
      case growKey: commitSize(sizeRef.current + step); e.preventDefault(); break
      case shrinkKey: commitSize(sizeRef.current - step); e.preventDefault(); break
      case 'Home': commitSize(minSize); e.preventDefault(); break
      case 'End': commitSize(maxSize); e.preventDefault(); break
    }
  }, [growKey, shrinkKey, step, minSize, maxSize, commitSize])

  const onDoubleClick = useCallback(() => {
    commitSize(defaultSize)
  }, [defaultSize, commitSize])

  const separatorProps = {
    role: 'separator' as const,
    'aria-orientation': (isHorizontal ? 'vertical' : 'horizontal') as 'vertical' | 'horizontal',
    'aria-valuenow': size,
    'aria-valuemin': minSize,
    'aria-valuemax': maxSize,
    tabIndex: 0,
    onPointerDown,
    onKeyDown,
    onDoubleClick,
    style: { cursor: (isHorizontal ? 'col-resize' : 'row-resize') as string },
  }

  return { separatorProps, size }
}

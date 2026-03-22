import { useState, useCallback, useRef, useEffect } from 'react'

interface UseResizerOptions {
  defaultSize: number
  minSize: number
  maxSize: number
  direction?: 'horizontal' | 'vertical'
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
  const { defaultSize, minSize, maxSize, direction = 'horizontal', step = 10, storageKey } = options
  const [size, setSize] = useState(() => loadSize(storageKey, defaultSize, minSize, maxSize))
  const dragging = useRef(false)
  const startX = useRef(0)
  const startSize = useRef(0)
  const sizeRef = useRef(size)
  sizeRef.current = size
  const separatorRef = useRef<HTMLElement | null>(null)

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
      const delta = e.clientX - startX.current
      const next = clamp(startSize.current + delta)
      sizeRef.current = next
      // DOM direct manipulation — no React re-render
      const el = separatorRef.current
      if (el) {
        el.setAttribute('aria-valuenow', String(next))
        // Apply width to left panel (previousElementSibling)
        const panel = el.previousElementSibling as HTMLElement | null
        if (panel) panel.style.width = `${next}px`
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
    startX.current = e.clientX
    startSize.current = sizeRef.current
    separatorRef.current = e.currentTarget as HTMLElement
    ;(e.currentTarget as HTMLElement).focus()
    e.preventDefault()
  }, [])

  const isHorizontal = direction === 'horizontal'
  const growKey = isHorizontal ? 'ArrowRight' : 'ArrowDown'
  const shrinkKey = isHorizontal ? 'ArrowLeft' : 'ArrowUp'

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

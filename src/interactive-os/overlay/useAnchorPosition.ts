// ② 2026-03-28-overlay-core-layer-prd.md
import { useEffect, useId } from 'react'
import type { RefObject } from 'react'

export type PositionArea =
  | 'block-end'
  | 'block-start'
  | 'inline-end'
  | 'inline-start'
  | 'block-end span-inline-end'
  | 'block-start span-inline-end'

interface UseAnchorPositionOptions {
  triggerRef: RefObject<HTMLElement | null>
  contentRef: RefObject<HTMLElement | null>
  isOpen: boolean
  positionArea?: PositionArea
}

const supportsAnchor = typeof CSS !== 'undefined' && CSS.supports?.('anchor-name: --x')

export function useAnchorPosition({
  triggerRef,
  contentRef,
  isOpen,
  positionArea = 'block-end',
}: UseAnchorPositionOptions): { anchorName: string } {
  const rawId = useId()
  const anchorName = `--anchor-${rawId.replace(/[^a-zA-Z0-9-]/g, '')}`

  useEffect(() => {
    const trigger = triggerRef.current
    if (!trigger || !supportsAnchor) return
    ;(trigger.style as unknown as Record<string, string>).anchorName = anchorName
    return () => {
      ;(trigger.style as unknown as Record<string, string>).anchorName = ''
    }
  }, [triggerRef, anchorName])

  useEffect(() => {
    const content = contentRef.current
    if (!content || !supportsAnchor) return
    ;(content.style as unknown as Record<string, string>).positionAnchor = anchorName
    content.style.setProperty('position-area', positionArea)
    return () => {
      ;(content.style as unknown as Record<string, string>).positionAnchor = ''
      content.style.removeProperty('position-area')
    }
  }, [contentRef, anchorName, positionArea])

  // Safari fallback: JS-based positioning (block-axis only)
  useEffect(() => {
    if (supportsAnchor || !isOpen) return

    const trigger = triggerRef.current
    const content = contentRef.current
    if (!trigger || !content) return

    let rafId = 0

    function update() {
      const triggerRect = trigger!.getBoundingClientRect()
      const contentRect = content!.getBoundingClientRect()
      const viewportHeight = window.innerHeight

      let top = triggerRect.bottom + 4
      if (top + contentRect.height > viewportHeight && triggerRect.top > contentRect.height) {
        top = triggerRect.top - contentRect.height - 4
      }

      content!.style.position = 'fixed'
      content!.style.left = `${triggerRect.left}px`
      content!.style.top = `${top}px`
    }

    function scheduleUpdate() {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', scheduleUpdate, { passive: true })
    window.addEventListener('resize', scheduleUpdate, { passive: true })

    return () => {
      cancelAnimationFrame(rafId)
      window.removeEventListener('scroll', scheduleUpdate)
      window.removeEventListener('resize', scheduleUpdate)
    }
  }, [triggerRef, contentRef, isOpen])

  return { anchorName }
}

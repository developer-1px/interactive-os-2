// ② 2026-04-03-plugin-effect-autoscroll-prd.md
import { useEffect, useRef } from 'react'
import { definePlugin } from './definePlugin'

const BOTTOM_THRESHOLD = 40

function isNearBottom(el: HTMLElement): boolean {
  return el.scrollHeight - el.scrollTop - el.clientHeight <= BOTTOM_THRESHOLD
}

function scrollToBottom(el: HTMLElement, rafRef: React.MutableRefObject<number>) {
  if (rafRef.current) cancelAnimationFrame(rafRef.current)
  rafRef.current = requestAnimationFrame(() => {
    el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' })
    rafRef.current = 0
  })
}

/** Generic autoscroll hook — scroll to bottom on new content, respect user scroll-up */
export function useAutoscroll(containerRef: React.RefObject<HTMLElement | null>) {
  const userScrolledUpRef = useRef(false)
  const rafRef = useRef(0)

  // Wheel → disable autoscroll, scroll near bottom → re-enable
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const onWheel = () => {
      userScrolledUpRef.current = true
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0 }
    }
    const onScroll = () => {
      if (isNearBottom(el)) userScrolledUpRef.current = false
    }
    el.addEventListener('wheel', onWheel, { passive: true })
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('scroll', onScroll)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- containerRef is stable

  // MutationObserver → scroll when new direct children (message rows) are added
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new MutationObserver(() => {
      if (userScrolledUpRef.current) return
      scrollToBottom(el, rafRef)
    })
    observer.observe(el, { childList: true })
    return () => {
      observer.disconnect()
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- containerRef is stable

  // IntersectionObserver → scroll when last entry crosses the bottom boundary
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    let currentTarget: Element | null = null

    const io = new IntersectionObserver(
      (entries) => {
        if (userScrolledUpRef.current) return
        for (const entry of entries) {
          if (!entry.isIntersecting) {
            scrollToBottom(el, rafRef)
          }
        }
      },
      { root: el, threshold: 0 },
    )

    // Observe the last child; re-observe when children change
    function observeLast() {
      if (currentTarget) io.unobserve(currentTarget)
      currentTarget = el!.lastElementChild
      if (currentTarget) io.observe(currentTarget)
    }
    observeLast()

    const mo = new MutationObserver(observeLast)
    mo.observe(el, { childList: true })

    return () => {
      io.disconnect()
      mo.disconnect()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps -- containerRef is stable
}

/** Autoscroll plugin — definePlugin wrapper for OS integration */
export function autoscroll() {
  return definePlugin({
    name: 'autoscroll',
    useEffect: (ctx) => {
      useAutoscroll(ctx.containerRef)
    },
  })
}

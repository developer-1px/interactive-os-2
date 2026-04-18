var e=`/**
 * Scroll container so that \`el\` is centered. Resolves when scroll settles
 * (scrollend / rAF-idle fallback / 600ms safety).
 */
export function scrollToElementAwait(container: HTMLElement, el: Element): Promise<void> {
  const containerRect = container.getBoundingClientRect()
  const lineRect = el.getBoundingClientRect()
  const lineCenter = lineRect.top - containerRect.top + container.scrollTop + lineRect.height / 2
  const targetScroll = Math.max(0, lineCenter - containerRect.height / 2)
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
    container.addEventListener('scrollend', onScrollEnd, { once: true })

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

    const safety = setTimeout(finish, 600)
    container.scrollTo({ top: targetScroll, behavior: 'smooth' })
  })
}
`;export{e as default};
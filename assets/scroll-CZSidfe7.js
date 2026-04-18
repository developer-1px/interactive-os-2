var e=`// ② scroll-plugin-prd.md
import { definePlugin } from './definePlugin'

/**
 * Scroll plugin — Space/Shift+Space로 containerRef 내 [data-scroll-target] 영역을 반페이지 스크롤.
 * store 변경 없이 DOM side-effect만 수행.
 */
export function scroll() {
  return definePlugin({
    name: 'scroll',
    onUnhandledKey(event: KeyboardEvent) {
      if (event.key !== ' ' || event.ctrlKey || event.altKey || event.metaKey) return false

      const el = (event.target as HTMLElement)
      const container = el?.closest<HTMLElement>('[data-aria-container]')
      const target = container?.querySelector<HTMLElement>('[data-scroll-target]')
      if (!target) return false

      target.scrollBy(0, event.shiftKey ? -target.clientHeight / 2 : target.clientHeight / 2)
      return true
    },
  })
}
`;export{e as default};
var e=`// ② 2026-04-04-virtual-scroll-plugin-prd.md
import type { RefObject } from 'react'
import { definePlugin } from './definePlugin'
import { useVirtualScroll } from './useVirtualScroll'
import { ROOT_ID } from '../store/types'

interface VirtualScrollOptions {
  estimatedItemHeight: number
  overscan?: number
}

// ② 2026-04-04-virtual-scroll-plugin-prd.md
/**
 * Component hook — reads virtual scroll state.
 * Works with or without the virtualScroll plugin.
 * Use when itemCount is component-controlled (e.g. CodeViewer virtualized lines).
 */
export function useVirtualScrollState(
  options: VirtualScrollOptions & {
    itemCount: number
    containerRef?: RefObject<HTMLDivElement | null>
  },
) {
  return useVirtualScroll(options)
}

// ② 2026-04-04-virtual-scroll-plugin-prd.md
/**
 * OS plugin — virtualizes store rootIds via useEffect.
 * Automatically derives itemCount from store.rootIds.length.
 */
export function virtualScroll(options: VirtualScrollOptions) {
  return definePlugin({
    name: 'virtualScroll',
    useEffect: (ctx) => {
      const store = ctx.getStore()
      const rootChildren = store.relationships[ROOT_ID] ?? []
      useVirtualScroll({
        ...options,
        itemCount: rootChildren.length,
        containerRef: ctx.containerRef as RefObject<HTMLDivElement | null>,
      })
    },
  })
}
`;export{e as default};
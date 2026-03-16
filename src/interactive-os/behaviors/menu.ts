import type { AriaBehavior, NodeState } from './types'

export const menu: AriaBehavior = {
  role: 'menu',
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    ArrowRight: (ctx) => ctx.isExpanded ? ctx.focusChild() : ctx.expand(),
    ArrowLeft: (ctx) => ctx.isExpanded ? ctx.collapse() : ctx.focusParent(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  },
  focusStrategy: {
    type: 'roving-tabindex',
    orientation: 'vertical',
  },
  ariaAttributes: (_node, state: NodeState) => {
    const attrs: Record<string, string> = {}
    if (state.expanded !== undefined) {
      attrs['aria-expanded'] = String(state.expanded)
    }
    return attrs
  },
}

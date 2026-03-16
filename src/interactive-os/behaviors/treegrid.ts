import type { AriaBehavior, NodeState } from './types'

export const treegrid: AriaBehavior = {
  role: 'treegrid',
  childRole: 'row',
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    ArrowRight: (ctx) => ctx.isExpanded ? ctx.focusChild() : ctx.expand(),
    ArrowLeft: (ctx) => ctx.isExpanded ? ctx.collapse() : ctx.focusParent(),
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.toggleSelect(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
  },
  focusStrategy: {
    type: 'roving-tabindex',
    orientation: 'vertical',
  },
  ariaAttributes: (_node, state: NodeState) => {
    const attrs: Record<string, string> = {
      'aria-selected': String(state.selected),
      'aria-posinset': String(state.index + 1),
      'aria-setsize': String(state.siblingCount),
    }
    if (state.expanded !== undefined) {
      attrs['aria-expanded'] = String(state.expanded)
    }
    if (state.level !== undefined) {
      attrs['aria-level'] = String(state.level)
    }
    return attrs
  },
}

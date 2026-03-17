import type { AriaBehavior, NodeState } from './types'

export const tree: AriaBehavior = {
  role: 'tree',
  childRole: 'treeitem',
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    ArrowRight: (ctx) => ctx.isExpanded ? ctx.focusChild() : ctx.expand(),
    ArrowLeft: (ctx) => ctx.isExpanded ? ctx.collapse() : ctx.focusParent(),
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.toggleSelect(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
    'Shift+ArrowDown': (ctx) => ctx.extendSelection('next'),
    'Shift+ArrowUp': (ctx) => ctx.extendSelection('prev'),
    'Shift+Home': (ctx) => ctx.extendSelection('first'),
    'Shift+End': (ctx) => ctx.extendSelection('last'),
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

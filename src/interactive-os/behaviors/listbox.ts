import type { AriaBehavior, NodeState } from './types'

export const listbox: AriaBehavior = {
  role: 'listbox',
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
    Space: (ctx) => ctx.toggleSelect(),
    Enter: (ctx) => ctx.activate(),
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
  ariaAttributes: (_node, state: NodeState) => {
    const attrs: Record<string, string> = {
      'aria-selected': String(state.selected),
      'aria-posinset': String(state.index + 1),
      'aria-setsize': String(state.siblingCount),
    }
    return attrs
  },
}

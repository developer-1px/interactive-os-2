import type { AriaBehavior, NodeState } from './types'

export const listbox: AriaBehavior = {
  role: 'listbox',
  childRole: 'option',
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
    Space: (ctx) => ctx.toggleSelect(),
    Enter: (ctx) => ctx.activate(),
    'Shift+ArrowDown': (ctx) => ctx.extendSelection('next'),
    'Shift+ArrowUp': (ctx) => ctx.extendSelection('prev'),
    'Shift+Home': (ctx) => ctx.extendSelection('first'),
    'Shift+End': (ctx) => ctx.extendSelection('last'),
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
  activateOnClick: true,
  ariaAttributes: (_node, state: NodeState) => {
    const attrs: Record<string, string> = {
      'aria-selected': String(state.selected),
      'aria-posinset': String(state.index + 1),
      'aria-setsize': String(state.siblingCount),
    }
    return attrs
  },
}

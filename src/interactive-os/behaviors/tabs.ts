import type { AriaBehavior, NodeState } from './types'

export const tabs: AriaBehavior = {
  role: 'tablist',
  childRole: 'tab',
  keyMap: {
    ArrowRight: (ctx) => ctx.focusNext(),
    ArrowLeft: (ctx) => ctx.focusPrev(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' },
  ariaAttributes: (_node, state: NodeState) => ({
    'aria-selected': String(state.selected),
  }),
}

import type { AriaBehavior, NodeState } from './types'

export const radiogroup: AriaBehavior = {
  role: 'radiogroup',
  childRole: 'radio',
  selectionMode: 'single',
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext({ wrap: true }),
    ArrowUp: (ctx) => ctx.focusPrev({ wrap: true }),
    ArrowRight: (ctx) => ctx.focusNext({ wrap: true }),
    ArrowLeft: (ctx) => ctx.focusPrev({ wrap: true }),
    Space: (ctx) => ctx.toggleSelect(),
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
  activateOnClick: true,
  ariaAttributes: (_node, state: NodeState) => ({
    'aria-checked': String(state.selected),
  }),
}

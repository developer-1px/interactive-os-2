import type { AriaBehavior, NodeState } from './types'

export const switchBehavior: AriaBehavior = {
  role: 'switch',
  childRole: 'switch',
  keyMap: {
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  },
  focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' },
  expandable: true,
  activateOnClick: true,
  ariaAttributes: (_node, state: NodeState) => ({
    'aria-checked': String(state.expanded ?? false),
  }),
}

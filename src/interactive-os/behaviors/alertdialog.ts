import type { AriaBehavior, NodeState } from './types'

export const alertdialog: AriaBehavior = {
  role: 'alertdialog',
  childRole: 'group',
  keyMap: {
    Escape: (ctx) => ctx.collapse(),
  },
  focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' },
  ariaAttributes: (_node, state: NodeState) => {
    const attrs: Record<string, string> = { 'aria-modal': 'true' }
    if (state.expanded !== undefined) {
      attrs['aria-expanded'] = String(state.expanded)
    }
    return attrs
  },
}

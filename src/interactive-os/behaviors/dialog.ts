import type { AriaBehavior, NodeState } from './types'

export const dialog: AriaBehavior = {
  role: 'dialog',
  childRole: 'group',
  keyMap: {
    Escape: (ctx) => ctx.collapse(), // close dialog
    Tab: (ctx) => ctx.focusNext(),   // trap focus within dialog
  },
  focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
  ariaAttributes: (_node, state: NodeState) => {
    const attrs: Record<string, string> = {}
    if (state.expanded !== undefined) {
      attrs['aria-expanded'] = String(state.expanded)
    }
    return attrs
  },
}

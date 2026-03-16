import type { AriaBehavior, NodeState } from './types'

export const disclosure: AriaBehavior = {
  role: 'group',
  childRole: 'button',
  keyMap: {
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
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

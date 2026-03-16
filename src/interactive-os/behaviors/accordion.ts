import type { AriaBehavior, NodeState } from './types'

export const accordion: AriaBehavior = {
  role: 'region',
  childRole: 'heading',
  keyMap: {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
    Enter: (ctx) => ctx.activate(),
    Space: (ctx) => ctx.activate(),
  },
  focusStrategy: {
    type: 'roving-tabindex',
    orientation: 'vertical',
  },
  ariaAttributes: (_node, state: NodeState) => {
    const attrs: Record<string, string> = {}
    if (state.expanded !== undefined) {
      attrs['aria-expanded'] = String(state.expanded)
    }
    return attrs
  },
}

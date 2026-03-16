import type { AriaBehavior, NodeState } from './types'

export function grid(options: { columns: number }): AriaBehavior {
  return {
    role: 'grid',
    childRole: 'row',
    colCount: options.columns,
    keyMap: {
      ArrowDown: (ctx) => ctx.focusNext(),
      ArrowUp: (ctx) => ctx.focusPrev(),
      ArrowRight: (ctx) => {
        const cmd = ctx.grid?.focusNextCol()
        return cmd ?? ctx.focusNext()
      },
      ArrowLeft: (ctx) => {
        const cmd = ctx.grid?.focusPrevCol()
        return cmd ?? ctx.focusPrev()
      },
      Home: (ctx) => {
        const cmd = ctx.grid?.focusFirstCol()
        return cmd ?? ctx.focusFirst()
      },
      End: (ctx) => {
        const cmd = ctx.grid?.focusLastCol()
        return cmd ?? ctx.focusLast()
      },
      'Mod+Home': (ctx) => ctx.focusFirst(),
      'Mod+End': (ctx) => ctx.focusLast(),
      Space: (ctx) => ctx.toggleSelect(),
    },
    focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-rowindex': String(state.index + 1),
      'aria-selected': String(state.selected),
    }),
  }
}

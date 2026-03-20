import type { Axis } from './compose-pattern'

export function navGrid(): Axis {
  return {
    ArrowDown: (ctx) => ctx.focusNext(),
    ArrowUp: (ctx) => ctx.focusPrev(),
    ArrowRight: (ctx) => ctx.grid?.focusNextCol() ?? ctx.focusNext(),
    ArrowLeft: (ctx) => ctx.grid?.focusPrevCol() ?? ctx.focusPrev(),
    Home: (ctx) => ctx.grid?.focusFirstCol() ?? ctx.focusFirst(),
    End: (ctx) => ctx.grid?.focusLastCol() ?? ctx.focusLast(),
    'Mod+Home': (ctx) => ctx.focusFirst(),
    'Mod+End': (ctx) => ctx.focusLast(),
  }
}

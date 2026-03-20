import type { Axis } from './composePattern'

export const navV: Axis = {
  ArrowDown: (ctx) => ctx.focusNext(),
  ArrowUp: (ctx) => ctx.focusPrev(),
  Home: (ctx) => ctx.focusFirst(),
  End: (ctx) => ctx.focusLast(),
}

import type { Axis } from './composePattern'

export function navH(options?: { wrap?: boolean }): Axis {
  const wrap = options?.wrap
  return {
    ArrowRight: (ctx) => ctx.focusNext(wrap ? { wrap: true } : undefined),
    ArrowLeft: (ctx) => ctx.focusPrev(wrap ? { wrap: true } : undefined),
    Home: (ctx) => ctx.focusFirst(),
    End: (ctx) => ctx.focusLast(),
  }
}

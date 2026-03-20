import type { Axis } from './compose-pattern'

export function navVhUniform(options?: { wrap?: boolean }): Axis {
  const opts = options?.wrap ? { wrap: true } : undefined
  return {
    ArrowDown: (ctx) => ctx.focusNext(opts),
    ArrowUp: (ctx) => ctx.focusPrev(opts),
    ArrowRight: (ctx) => ctx.focusNext(opts),
    ArrowLeft: (ctx) => ctx.focusPrev(opts),
  }
}

import type { Axis } from './composePattern'

export const focusTrap: Axis = {
  Escape: (ctx) => ctx.collapse(),
}

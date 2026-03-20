import type { Axis } from './compose-pattern'

export const focusTrap: Axis = {
  Escape: (ctx) => ctx.collapse(),
}

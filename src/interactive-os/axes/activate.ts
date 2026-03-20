import type { Axis } from './compose-pattern'

export const activate: Axis = {
  Enter: (ctx) => ctx.activate(),
  Space: (ctx) => ctx.activate(),
}

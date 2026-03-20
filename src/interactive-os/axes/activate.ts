import type { Axis } from './composePattern'

export const activate: Axis = {
  Enter: (ctx) => ctx.activate(),
  Space: (ctx) => ctx.activate(),
}

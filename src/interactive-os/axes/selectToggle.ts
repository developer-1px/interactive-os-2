import type { Axis } from './composePattern'

export const selectToggle: Axis = {
  Space: (ctx) => ctx.toggleSelect(),
}

import type { Axis } from './compose-pattern'

export const selectToggle: Axis = {
  Space: (ctx) => ctx.toggleSelect(),
}

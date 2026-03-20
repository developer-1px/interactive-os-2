import type { Axis } from './compose-pattern'

export const activateFollowFocus: Axis = {
  Enter: (ctx) => ctx.activate(),
  Space: (ctx) => ctx.activate(),
}

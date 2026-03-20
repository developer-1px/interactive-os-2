import type { Axis } from './compose-pattern'

export const selectExtended: Axis = {
  'Shift+ArrowDown': (ctx) => ctx.extendSelection('next'),
  'Shift+ArrowUp': (ctx) => ctx.extendSelection('prev'),
  'Shift+Home': (ctx) => ctx.extendSelection('first'),
  'Shift+End': (ctx) => ctx.extendSelection('last'),
}

import type { Axis } from './composePattern'

export const selectExtended: Axis = {
  'Shift+ArrowDown': (ctx) => ctx.extendSelection('next'),
  'Shift+ArrowUp': (ctx) => ctx.extendSelection('prev'),
  'Shift+Home': (ctx) => ctx.extendSelection('first'),
  'Shift+End': (ctx) => ctx.extendSelection('last'),
}

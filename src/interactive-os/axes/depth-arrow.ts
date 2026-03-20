import type { Axis } from './compose-pattern'

export const depthArrow: Axis = {
  ArrowRight: (ctx) => (ctx.isExpanded ? ctx.focusChild() : ctx.expand()),
  ArrowLeft: (ctx) => (ctx.isExpanded ? ctx.collapse() : ctx.focusParent()),
}

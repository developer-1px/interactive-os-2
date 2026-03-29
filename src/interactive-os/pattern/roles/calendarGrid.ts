import type { PatternContext } from '../../axis/types'
import type { Command } from '../../engine/types'
import { composePattern } from '../composePattern'
import { navigate, focusCommands } from '../../axis/navigate'
import { selected, selectionCommands } from '../../axis/select'
import { activateHandler } from '../../axis/activate'

// APG Date Picker — Calendar Grid (42-cell flat grid, 6×7)

function getVisibleList(ctx: PatternContext): string[] {
  return ctx.getChildren('__root__')
}

function moveBy(ctx: PatternContext, offset: number): Command {
  const nodes = getVisibleList(ctx)
  const idx = nodes.indexOf(ctx.focused)
  const next = idx + offset
  if (next < 0 || next >= nodes.length) return focusCommands.setFocus(ctx.focused)
  return focusCommands.setFocus(nodes[next]!)
}

const nextDay = (ctx: PatternContext): Command => moveBy(ctx, 1)
const prevDay = (ctx: PatternContext): Command => moveBy(ctx, -1)
const nextWeek = (ctx: PatternContext): Command => moveBy(ctx, 7)
const prevWeek = (ctx: PatternContext): Command => moveBy(ctx, -7)

const firstDayOfWeek = (ctx: PatternContext): Command => {
  const nodes = getVisibleList(ctx)
  const idx = nodes.indexOf(ctx.focused)
  return focusCommands.setFocus(nodes[idx - (idx % 7)]!)
}
const lastDayOfWeek = (ctx: PatternContext): Command => {
  const nodes = getVisibleList(ctx)
  const idx = nodes.indexOf(ctx.focused)
  return focusCommands.setFocus(nodes[Math.min(idx - (idx % 7) + 6, nodes.length - 1)]!)
}

const selectDay = (ctx: PatternContext): Command => selectionCommands.select(ctx.focused)

const nav = navigate('both')
const sel = selected('single')

export const calendarGrid = composePattern(
  { role: 'grid', childRole: 'gridcell' },
  [nav, sel],
  {
    ArrowRight: nextDay,
    ArrowLeft: prevDay,
    ArrowDown: nextWeek,
    ArrowUp: prevWeek,
    Home: firstDayOfWeek,
    End: lastDayOfWeek,
    Space: selectDay,
    Enter: activateHandler,
  },
)

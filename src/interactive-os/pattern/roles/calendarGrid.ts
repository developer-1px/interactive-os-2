import type { PatternContext } from '../../axis/types'
import type { Command } from '../../engine/types'
import { composePattern } from '../composePattern'
import { focusCommands } from '../../axis/navigate'
import { selectionCommands } from '../../axis/select'
import { selectConfig } from '../../axis/select'
import { activateHandler } from '../../axis/activate'

// APG Date Picker — Calendar Grid
// https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-datepicker/
// 42-cell flat grid (6 rows × 7 columns), navigation wraps across rows

// ── Helpers ──

function getVisibleList(ctx: PatternContext): string[] {
  // Walk root children (flat 42-cell list)
  return ctx.getChildren('__root__')
}

function moveBy(ctx: PatternContext, offset: number): Command {
  const nodes = getVisibleList(ctx)
  const idx = nodes.indexOf(ctx.focused)
  const next = idx + offset
  if (next < 0 || next >= nodes.length) return focusCommands.setFocus(ctx.focused)
  return focusCommands.setFocus(nodes[next]!)
}

// ── Handlers ──

// ArrowRight/Left: ±1 day (wraps across rows)
const nextDay = (ctx: PatternContext): Command => moveBy(ctx, 1)
const prevDay = (ctx: PatternContext): Command => moveBy(ctx, -1)

// ArrowDown/Up: ±7 days (next/prev week)
const nextWeek = (ctx: PatternContext): Command => moveBy(ctx, 7)
const prevWeek = (ctx: PatternContext): Command => moveBy(ctx, -7)

// Home/End: first/last day of current week (row)
const firstDayOfWeek = (ctx: PatternContext): Command => {
  const nodes = getVisibleList(ctx)
  const idx = nodes.indexOf(ctx.focused)
  const rowStart = idx - (idx % 7)
  return focusCommands.setFocus(nodes[rowStart]!)
}
const lastDayOfWeek = (ctx: PatternContext): Command => {
  const nodes = getVisibleList(ctx)
  const idx = nodes.indexOf(ctx.focused)
  const rowEnd = idx - (idx % 7) + 6
  return focusCommands.setFocus(nodes[Math.min(rowEnd, nodes.length - 1)]!)
}

// Space: select without closing
const selectDay = (ctx: PatternContext): Command =>
  selectionCommands.select(ctx.focused)

// ── Pattern ──

export const calendarGrid = composePattern(
  {
    role: 'grid',
    childRole: 'gridcell',
    focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
  },
  selectConfig({ mode: 'single' }),
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

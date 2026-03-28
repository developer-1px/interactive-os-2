import type { AriaPattern, NodeState } from '../types'
import { composePattern } from '../composePattern'
import { select } from '../../axis/select'
import { navigate, focusNext, focusPrev, focusFirst, focusLast, focusNextCol, focusPrevCol, focusFirstCol, focusLastCol } from '../../axis/navigate'
import { toggleSelect, extendSelectionNext, extendSelectionPrev, extendSelectionFirst, extendSelectionLast } from '../../axis/select'
import type { PatternContext } from '../../axis/types'

// APG Grid — https://www.w3.org/WAI/ARIA/apg/patterns/grid/

const gridIdentity = {
  role: 'grid',
  childRole: 'row',
  ariaAttributes: (_node: unknown, state: NodeState) => ({
    'aria-rowindex': String(state.index + 1),
    'aria-selected': String(state.selected),
  }),
}

// ── Data Grid ──
// Navigation: cell-level arrows, Home/End per row, Ctrl+Home/End absolute
// Selection: Shift+Arrow extends, no wrapping

export function grid(options: { columns: number; tabCycle?: boolean }): AriaPattern {
  return composePattern(
    gridIdentity,
    select({ mode: 'multiple', extended: true }),
    navigate({ grid: { columns: options.columns, tabCycle: options.tabCycle } }),
  )
}

// ── Layout Grid ──
// Wrapping navigation: arrows wrap across rows/columns
// Home/End → first/last cell in grid (not just row)

export function layoutGrid(options: { columns: number }): AriaPattern {
  return composePattern(
    gridIdentity,
    select(),
    navigate({ grid: { columns: options.columns } }),
    {
      ArrowRight: (ctx: PatternContext) => ctx.grid?.focusNextCol() ?? focusNext(ctx),
      ArrowLeft: (ctx: PatternContext) => ctx.grid?.focusPrevCol() ?? focusPrev(ctx),
      Home: focusFirst,
      End: focusLast,
    },
  )
}

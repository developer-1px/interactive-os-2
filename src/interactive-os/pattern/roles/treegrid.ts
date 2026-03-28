import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { focusNext, focusPrev, gridTabCycleNext, gridTabCyclePrev } from '../../axis/navigate'
import { toggleSelect, extendSelectionNext, extendSelectionPrev, extendSelectionFirst, extendSelectionLast, extendSelectionToFocused, selectionCommands } from '../../axis/select'
import { selectConfig } from '../../axis/select'
import { expandConfig } from '../../axis/expand'
import { activateHandler } from '../../axis/activate'
import type { PatternContext } from '../../axis/types'
import type { Command } from '../../engine/types'
import { createBatchCommand } from '../../engine/types'

// APG Treegrid — https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/examples/treegrid-1/
// Hierarchical data grid: row focus ↔ cell focus mode + tree expand/collapse + selection
// 3 navigation models — this implements "Rows first, cells reachable"

const selectAndAnchor = (ctx: PatternContext): Command =>
  createBatchCommand([
    selectionCommands.select(ctx.focused),
    selectionCommands.setAnchor(ctx.focused),
  ])

// ── Row ↔ Cell mode handlers (APG §Keyboard) ──

// APG: "If a row is focused and expanded, focuses the first cell.
//        If a cell is focused, moves one cell to the right."
const arrowRight = (ctx: PatternContext): Command | void => {
  const g = ctx.grid
  if (g && g.colIndex >= 0) return g.focusNextCol()    // Cell mode → next cell
  if (ctx.isExpanded) {
    return g ? g.focusFirstCol() : ctx.focusChild()    // Row expanded → enter cell mode (or focus child if no grid)
  }
  return ctx.expand()                                   // Row collapsed → expand
}

// APG: "If a cell in the first column is focused, focuses the row.
//        If a cell in a different column is focused, moves one cell to the left.
//        If a row is focused and expanded, collapses. If collapsed, moves to parent."
const arrowLeft = (ctx: PatternContext): Command | void => {
  const g = ctx.grid
  if (g && g.colIndex >= 0) {
    if (g.colIndex === 0) return g.focusRow()          // First cell → exit to row mode
    return g.focusPrevCol()                             // Other cell → prev cell
  }
  return ctx.isExpanded ? ctx.collapse() : ctx.focusParent() // Row mode
}

// APG: "If a row is focused, moves to first/last row.
//        If a cell is focused, moves to first/last cell in row."
const home = (ctx: PatternContext): Command | void => {
  if (ctx.grid && ctx.grid.colIndex >= 0) return ctx.grid.focusFirstCol()
  return ctx.focusFirst()
}

const end = (ctx: PatternContext): Command | void => {
  if (ctx.grid && ctx.grid.colIndex >= 0) return ctx.grid.focusLastCol()
  return ctx.focusLast()
}

// APG: "Ctrl+Home: row→first row, cell→first row same column"
const ctrlHome = (ctx: PatternContext): Command => ctx.focusFirst()
const ctrlEnd = (ctx: PatternContext): Command => ctx.focusLast()

export function treegrid(columns: number): AriaPattern {
  return composePattern(
    {
      role: 'treegrid',
      childRole: 'row',
      focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
      colCount: columns,
    },
    selectConfig({ mode: 'multiple' }),
    expandConfig(),
    {
      // Navigation — row/cell mode aware
      ArrowDown: focusNext,
      ArrowUp: focusPrev,
      ArrowRight: arrowRight,
      ArrowLeft: arrowLeft,
      Home: home,
      End: end,
      'Mod+Home': ctrlHome,
      'Mod+End': ctrlEnd,

      // Tab — cycle through cells in row (APG: "moves focus to next interactive widget in row")
      Tab: gridTabCycleNext,
      'Shift+Tab': gridTabCyclePrev,

      // Activation
      Enter: activateHandler,

      // Selection — APG: Space toggles, Shift+Arrow extends
      Space: toggleSelect,
      'Shift+ArrowDown': extendSelectionNext,
      'Shift+ArrowUp': extendSelectionPrev,
      'Shift+Home': extendSelectionFirst,
      'Shift+End': extendSelectionLast,

      // Pointer
      Click: selectAndAnchor,
      'Shift+Click': extendSelectionToFocused,
      'Mod+Click': toggleSelect,
    },
  )
}

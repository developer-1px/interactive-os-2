import type { AriaPattern, NodeState } from '../types'
import { composePattern } from '../composePattern'
import { gridNav, focusNext, focusPrev, focusFirst, focusLast, focusNextCol, focusPrevCol, focusFirstCol, focusLastCol, gridTabCycleNext, gridTabCyclePrev } from '../../axis/navigate'
import { selectConfig, toggleSelect, extendSelectionNext, extendSelectionPrev, extendSelectionFirst, extendSelectionLast, extendSelectionToFocused } from '../../axis/select'
import type { PatternContext } from '../../axis/types'
import type { Command } from '../../engine/types'
import { createBatchCommand } from '../../engine/types'
import { selectionCommands } from '../../axis/select'

// APG Grid — https://www.w3.org/WAI/ARIA/apg/patterns/grid/

const gridIdentity = {
  role: 'grid',
  childRole: 'row',
  ariaAttributes: (_node: unknown, state: NodeState) => ({
    'aria-rowindex': String(state.index + 1),
    'aria-selected': String(state.selected),
  }),
}

// Click handlers — select the clicked node, anchor for shift
const selectAndAnchor = (ctx: PatternContext): Command =>
  createBatchCommand([
    selectionCommands.select(ctx.focused),
    selectionCommands.setAnchor(ctx.focused),
  ])

// ── Data Grid ──
// APG §Keyboard: cell-level arrows, Home/End per row, Ctrl+Home/End absolute
// APG §Selection: Shift+Arrow extends, Shift+Click range, Ctrl+Click toggle

export function grid(options: { columns: number; tabCycle?: boolean }): AriaPattern {
  return composePattern(
    gridIdentity,
    gridNav(options.columns),
    selectConfig({ mode: 'multiple' }),
    {
      // Navigation — APG §1 Data Grid
      ArrowRight: focusNextCol,
      ArrowLeft: focusPrevCol,
      ArrowDown: focusNext,
      ArrowUp: focusPrev,
      Home: focusFirstCol,
      End: focusLastCol,
      'Mod+Home': focusFirst,
      'Mod+End': focusLast,

      // Tab cycling (optional)
      ...(options.tabCycle && {
        Tab: gridTabCycleNext,
        'Shift+Tab': gridTabCyclePrev,
      }),

      // Selection — APG §2
      Space: toggleSelect,
      'Shift+ArrowDown': extendSelectionNext,
      'Shift+ArrowUp': extendSelectionPrev,
      'Shift+ArrowRight': extendSelectionNext,
      'Shift+ArrowLeft': extendSelectionPrev,
      'Shift+Home': extendSelectionFirst,
      'Shift+End': extendSelectionLast,

      // Pointer
      Click: selectAndAnchor,
      'Shift+Click': extendSelectionToFocused,
      'Mod+Click': toggleSelect,
    },
  )
}

// ── Layout Grid ──
// Wrapping navigation: arrows wrap across rows/columns
// Home/End → first/last cell in grid (not just row)

export function layoutGrid(options: { columns: number }): AriaPattern {
  return composePattern(
    gridIdentity,
    gridNav(options.columns),
    selectConfig(),
    {
      // Navigation — APG §3 Layout Grid (wrapping)
      ArrowRight: (ctx: PatternContext) => ctx.grid?.focusNextCol() ?? focusNext(ctx),
      ArrowLeft: (ctx: PatternContext) => ctx.grid?.focusPrevCol() ?? focusPrev(ctx),
      ArrowDown: focusNext,
      ArrowUp: focusPrev,
      Home: focusFirst,
      End: focusLast,

      // Selection
      Space: toggleSelect,

      // Pointer
      Click: selectAndAnchor,
      'Shift+Click': extendSelectionToFocused,
      'Mod+Click': toggleSelect,
    },
  )
}

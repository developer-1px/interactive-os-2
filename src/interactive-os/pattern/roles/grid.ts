import type { AriaPattern, NodeState } from '../types'
import { composePattern } from '../composePattern'
import { focusNext, focusPrev, focusFirst, focusLast, focusNextCol, focusPrevCol, focusFirstCol, focusLastCol, gridTabCycleNext, gridTabCyclePrev } from '../../axis/navigate'
import { toggleSelect, extendSelectionNext, extendSelectionPrev, extendSelectionFirst, extendSelectionLast, extendSelectionToFocused, selectionCommands } from '../../axis/select'
import type { PatternContext } from '../../axis/types'
import type { Command } from '../../engine/types'
import { createBatchCommand } from '../../engine/types'

// APG Grid — https://www.w3.org/WAI/ARIA/apg/patterns/grid/

const selectAndAnchor = (ctx: PatternContext): Command =>
  createBatchCommand([
    selectionCommands.select(ctx.focused),
    selectionCommands.setAnchor(ctx.focused),
  ])

// ── Data Grid ──

export function grid(options: { columns: number; tabCycle?: boolean }): AriaPattern {
  return composePattern(
    {
      role: 'grid',
      childRole: 'row',
      focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
      selectionMode: 'multiple',
      colCount: options.columns,
      ariaAttributes: (_node: unknown, state: NodeState) => ({
        'aria-rowindex': String(state.index + 1),
        'aria-selected': String(state.selected),
      }),
    },
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

export function layoutGrid(options: { columns: number }): AriaPattern {
  return composePattern(
    {
      role: 'grid',
      childRole: 'row',
      focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
      colCount: options.columns,
      ariaAttributes: (_node: unknown, state: NodeState) => ({
        'aria-rowindex': String(state.index + 1),
        'aria-selected': String(state.selected),
      }),
    },
    {
      // Navigation — APG §3 Layout Grid (wrapping)
      ArrowRight: (ctx: PatternContext) => ctx.grid?.focusNextCol() ?? focusNext(ctx),
      ArrowLeft: (ctx: PatternContext) => ctx.grid?.focusPrevCol() ?? focusPrev(ctx),
      ArrowDown: focusNext,
      ArrowUp: focusPrev,
      Home: focusFirst,
      End: focusLast,

      // Pointer
      Click: selectAndAnchor,
      'Shift+Click': extendSelectionToFocused,
      'Mod+Click': toggleSelect,
    },
  )
}

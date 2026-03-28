import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { focusNext, focusPrev, focusFirst, focusLast } from '../../axis/navigate'
import { toggleSelect, extendSelectionNext, extendSelectionPrev, extendSelectionFirst, extendSelectionLast, extendSelectionToFocused, selectionCommands } from '../../axis/select'
import { expandOrFocusChild, collapseOrFocusParent } from '../../axis/expand'
import { selectConfig } from '../../axis/select'
import { expandConfig } from '../../axis/expand'
import { activateHandler } from '../../axis/activate'
import type { PatternContext } from '../../axis/types'
import type { Command } from '../../engine/types'
import { createBatchCommand } from '../../engine/types'

// APG Treegrid — https://www.w3.org/WAI/ARIA/apg/patterns/treegrid/
// Hierarchical data grid: tree expand/collapse + row navigation + selection

const selectAndAnchor = (ctx: PatternContext): Command =>
  createBatchCommand([
    selectionCommands.select(ctx.focused),
    selectionCommands.setAnchor(ctx.focused),
  ])

export function treegrid(): AriaPattern {
  return composePattern(
    {
      role: 'treegrid',
      childRole: 'row',
      focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    },
    selectConfig({ mode: 'multiple' }),
    expandConfig(),
    {
      // Navigation — APG: Down/Up moves focus between rows
      ArrowDown: focusNext,
      ArrowUp: focusPrev,
      Home: focusFirst,
      End: focusLast,

      // Expand/Collapse — APG: Right expands or focuses child, Left collapses or focuses parent
      ArrowRight: expandOrFocusChild,
      ArrowLeft: collapseOrFocusParent,

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

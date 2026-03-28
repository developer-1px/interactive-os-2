import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { focusNext, focusPrev, focusFirst, focusLast } from '../../axis/navigate'
import { toggleSelect, extendSelectionNext, extendSelectionPrev, extendSelectionFirst, extendSelectionLast, extendSelectionToFocused, selectionCommands } from '../../axis/select'
import { activateHandler } from '../../axis/activate'
import { selectConfig } from '../../axis/select'
import type { PatternContext } from '../../axis/types'
import type { Command } from '../../engine/types'
import { createBatchCommand } from '../../engine/types'

// APG Listbox — https://www.w3.org/WAI/ARIA/apg/patterns/listbox/

const selectAndAnchor = (ctx: PatternContext): Command =>
  createBatchCommand([
    selectionCommands.select(ctx.focused),
    selectionCommands.setAnchor(ctx.focused),
  ])

export function listbox(): AriaPattern {
  return composePattern(
    {
      role: 'listbox',
      childRole: 'option',
      focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
      selectionMode: 'multiple',
    },
    selectConfig({ mode: 'multiple' }),
    {
      // Navigation
      ArrowDown: focusNext,
      ArrowUp: focusPrev,
      Home: focusFirst,
      End: focusLast,

      // Selection
      Space: toggleSelect,
      'Shift+ArrowDown': extendSelectionNext,
      'Shift+ArrowUp': extendSelectionPrev,
      'Shift+Home': extendSelectionFirst,
      'Shift+End': extendSelectionLast,

      // Activation
      Enter: activateHandler,

      // Pointer
      Click: selectAndAnchor,
      'Shift+Click': extendSelectionToFocused,
      'Mod+Click': toggleSelect,
    },
  )
}

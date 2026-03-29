import type { AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { focusNext, focusPrev, focusFirst, focusLast } from '../../axis/navigate'
import { toggleSelect, extendSelectionNext, extendSelectionPrev, extendSelectionFirst, extendSelectionLast, extendSelectionToFocused, selectAndAnchor } from '../../axis/select'
import { activateHandler } from '../../axis/activate'
import { selectConfig } from '../../axis/select'

// APG Listbox — https://www.w3.org/WAI/ARIA/apg/patterns/listbox/

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

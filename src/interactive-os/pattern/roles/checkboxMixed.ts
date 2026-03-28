// ② 2026-03-28-checked-axis-childrole-prd.md
import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import type { VisibilityFilter } from '../../engine/types'
import { composePattern } from '../composePattern'
import { toggleCheckHandler } from '../../axis/checked'
import { focusNext, focusPrev, focusFirst, focusLast } from '../../axis/navigate'

// APG Checkbox Mixed-State: parent reflects aggregate child state
// Parent: aria-checked = true|false|mixed (derived from children)
// Children: aria-checked = true|false (direct toggle)
//
// alwaysDescend: VisibilityFilter that makes container nodes focusable and always shows their children.
// Required because without a shouldDescend filter, getVisibleNodes skips container nodes entirely.
const alwaysDescendFilter: VisibilityFilter = {
  shouldDescend: () => true,
}

export const checkboxMixed = composePattern(
  {
    role: 'group',
    childRole: 'checkbox',
    checkedTracking: true,
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    visibilityFilter: alwaysDescendFilter,
    ariaAttributes: (_node: Entity, state: NodeState) => ({
      'aria-checked': String(state.checked ?? false),
    }),
  },
  {
    // Checked
    Enter: toggleCheckHandler,
    Space: toggleCheckHandler,
    Click: toggleCheckHandler,

    // Navigation (vertical, no wrap)
    ArrowDown: focusNext,
    ArrowUp: focusPrev,
    Home: focusFirst,
    End: focusLast,
  },
)

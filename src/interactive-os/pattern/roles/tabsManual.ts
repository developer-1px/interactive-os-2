import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { selectConfig } from '../../axis/select'
import { activateHandler } from '../../axis/activate'
import { focusNext, focusPrev, focusFirst, focusLast } from '../../axis/navigate'

// APG Tabs with Manual Activation: Arrow keys move focus only, Enter/Space selects
// Contrast with `tabs` (automatic) which has selectionFollowsFocus + activationFollowsSelection
export const tabsManual = composePattern(
  {
    role: 'tablist',
    childRole: 'tab',
    focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' },
    selectionMode: 'single',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
  },
  selectConfig({ mode: 'single' }),
  { keyMap: {}, config: { selectOnClick: true, activateOnClick: true, expandOnParentClick: true } },
  {
    // Navigation — horizontal
    ArrowRight: focusNext,
    ArrowLeft: focusPrev,
    Home: focusFirst,
    End: focusLast,

    // Selection (from select axis)
    Space: (ctx) => ctx.toggleSelect(),

    // Activation
    Enter: activateHandler,
  },
)

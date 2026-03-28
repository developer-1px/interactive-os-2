import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { selectConfig } from '../../axis/select'
import { activateHandler } from '../../axis/activate'
import { focusNext, focusPrev, focusFirst, focusLast } from '../../axis/navigate'

export const tabs = composePattern(
  {
    role: 'tablist',
    childRole: 'tab',
    focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' },
    selectionMode: 'single',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
    panelRole: 'tabpanel',
    panelVisibility: 'selected',
  },
  selectConfig({ mode: 'single', selectionFollowsFocus: true }),
  { keyMap: {}, config: { selectOnClick: true, activateOnClick: true, expandOnParentClick: true, activationFollowsSelection: true } },
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

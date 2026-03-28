import type { NodeState, AriaPattern } from '../types'
import { composePattern } from '../composePattern'
import { selectConfig } from '../../axis/select'

// APG Radio Group using aria-activedescendant: container holds focus,
// aria-activedescendant points to checked radio. Arrows move + select.
// Note: select({ selectOnClick }) handles click selection; activate() not needed.
export const radiogroupActivedescendant: AriaPattern = composePattern(
  {
    role: 'radiogroup',
    childRole: 'radio',
    focusStrategy: { type: 'aria-activedescendant', orientation: 'both' },
    selectionMode: 'single',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.selected),
    }),
  },
  selectConfig({ mode: 'single', selectionFollowsFocus: true }),
  { keyMap: {}, config: { selectOnClick: true } },
  {
    // Navigation — both orientations, wrap
    ArrowDown: (ctx) => ctx.focusNext({ wrap: true }),
    ArrowUp: (ctx) => ctx.focusPrev({ wrap: true }),
    ArrowRight: (ctx) => ctx.focusNext({ wrap: true }),
    ArrowLeft: (ctx) => ctx.focusPrev({ wrap: true }),

    // Selection (from select axis)
    Space: (ctx) => ctx.toggleSelect(),
  },
)

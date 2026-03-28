import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { selectConfig } from '../../axis/select'
import { activateHandler } from '../../axis/activate'

export const radiogroup = composePattern(
  {
    role: 'radiogroup',
    childRole: 'radio',
    focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
    selectionMode: 'single',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.selected),
    }),
  },
  selectConfig({ mode: 'single', selectionFollowsFocus: true }),
  { keyMap: {}, config: { selectOnClick: true, activateOnClick: true, expandOnParentClick: true } },
  {
    // Navigation — both orientations, wrap
    ArrowDown: (ctx) => ctx.focusNext({ wrap: true }),
    ArrowUp: (ctx) => ctx.focusPrev({ wrap: true }),
    ArrowRight: (ctx) => ctx.focusNext({ wrap: true }),
    ArrowLeft: (ctx) => ctx.focusPrev({ wrap: true }),

    // Selection (from select axis)
    Space: (ctx) => ctx.toggleSelect(),

    // Activation
    Enter: activateHandler,
  },
)

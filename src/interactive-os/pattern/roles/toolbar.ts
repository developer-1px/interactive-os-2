import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { activateHandler } from '../../axis/activate'
import { focusFirst, focusLast } from '../../axis/navigate'

export const toolbar = composePattern(
  {
    role: 'toolbar',
    childRole: 'button',
    focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' },
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-pressed': String(state.selected),
    }),
  },
  { keyMap: {}, config: { activateOnClick: true, expandOnParentClick: true } },
  {
    // Navigation — horizontal, wrap
    ArrowRight: (ctx) => ctx.focusNext({ wrap: true }),
    ArrowLeft: (ctx) => ctx.focusPrev({ wrap: true }),
    Home: focusFirst,
    End: focusLast,

    // Activation
    Enter: activateHandler,
    Space: activateHandler,
  },
)

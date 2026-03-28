import type { NodeState, AriaPattern } from '../types'
import type { Entity } from '../../store/types'
import { composePattern } from '../composePattern'
import { activateConfig, activateHandler } from '../../axis/activate'
import { expandConfig, expandOrFocusChild, collapseOrFocusParent } from '../../axis/expand'
import { focusFirst, focusLast } from '../../axis/navigate'

// APG Menu Button using aria-activedescendant: container holds focus,
// aria-activedescendant points to focused menuitem.

export const menuActivedescendant: AriaPattern = composePattern(
  {
    role: 'menu',
    childRole: 'menuitem',
    focusStrategy: { type: 'aria-activedescendant', orientation: 'vertical' },
    ariaAttributes: (_node: Entity, state: NodeState) => {
      const attrs: Record<string, string> = {}
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      return attrs
    },
  },
  activateConfig(),
  expandConfig(),
  {
    // Navigation — vertical wrap
    ArrowDown: (ctx) => ctx.focusNext({ wrap: true }),
    ArrowUp: (ctx) => ctx.focusPrev({ wrap: true }),
    Home: focusFirst,
    End: focusLast,

    // Expand — arrow mode
    ArrowRight: expandOrFocusChild,
    ArrowLeft: collapseOrFocusParent,

    // Activation
    Enter: activateHandler,
    Space: activateHandler,
  },
)

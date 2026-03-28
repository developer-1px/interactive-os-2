import type { NodeState, AriaPattern } from '../types'
import type { Entity } from '../../store/types'
import type { PatternContext } from '../../axis/types'
import { composePattern } from '../composePattern'
import { activate } from '../../axis/activate'
import { expand } from '../../axis/expand'

// APG Menu Button using aria-activedescendant: container holds focus,
// aria-activedescendant points to focused menuitem.
const navVerticalWrap = {
  ArrowDown: (ctx: PatternContext) => ctx.focusNext({ wrap: true }),
  ArrowUp: (ctx: PatternContext) => ctx.focusPrev({ wrap: true }),
  Home: (ctx: PatternContext) => ctx.focusFirst(),
  End: (ctx: PatternContext) => ctx.focusLast(),
}

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
  activate({ onClick: true }),
  expand({ mode: 'arrow' }),
  navVerticalWrap,
)

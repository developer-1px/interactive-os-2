import type { NodeState, AriaPattern } from '../types'
import type { PatternContext } from '../../axis/types'
import { composePattern } from '../composePattern'
import { select } from '../../axis/select'

// APG Radio Group using aria-activedescendant: container holds focus,
// aria-activedescendant points to checked radio. Arrows move + select.
// Note: select({ selectOnClick }) handles click selection; activate() not needed.
const navBothWrap = {
  ArrowDown: (ctx: PatternContext) => ctx.focusNext({ wrap: true }),
  ArrowUp: (ctx: PatternContext) => ctx.focusPrev({ wrap: true }),
  ArrowRight: (ctx: PatternContext) => ctx.focusNext({ wrap: true }),
  ArrowLeft: (ctx: PatternContext) => ctx.focusPrev({ wrap: true }),
}

export const radiogroupActivedescendant: AriaPattern = composePattern(
  {
    role: 'radiogroup',
    childRole: 'radio',
    focusStrategy: { type: 'aria-activedescendant', orientation: 'both' },
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.selected),
    }),
  },
  select({ mode: 'single', selectionFollowsFocus: true }),
  navBothWrap,
)

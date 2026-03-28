import type { AriaPattern, NodeState } from '../types'
import { composePattern } from '../composePattern'
import { expandVisibilityFilter, expandHandler, collapseHandler } from '../../axis/expand'
import { focusNext, focusPrev, focusFirst, focusLast } from '../../axis/navigate'
import type { PatternContext } from '../../axis/types'
import type { Command } from '../../engine/types'

// APG Accordion — https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/

const toggleExpand = (ctx: PatternContext): Command =>
  ctx.isExpanded ? collapseHandler(ctx) : expandHandler(ctx)

export const accordion: AriaPattern = composePattern(
  {
    role: 'region',
    childRole: 'heading',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    expandTracking: true,
    panelRole: 'region',
    panelVisibility: 'expanded',
    ariaAttributes: (_node, state: NodeState) => {
      const attrs: Record<string, string> = {}
      if (state.expanded !== undefined) {
        attrs['aria-expanded'] = String(state.expanded)
      }
      return attrs
    },
  },
  { keyMap: {}, visibilityFilter: expandVisibilityFilter },
  {
    // Keyboard — APG: "Space or Enter expands/collapses"
    Enter: toggleExpand,
    Space: toggleExpand,
    ArrowDown: focusNext,
    ArrowUp: focusPrev,
    Home: focusFirst,
    End: focusLast,

    // Pointer
    Click: toggleExpand,
  },
)

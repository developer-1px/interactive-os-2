import type { AriaPattern, NodeState } from '../types'
import { composePattern } from '../composePattern'
import { expandVisibilityFilter, toggleExpand } from '../../axis/expand'
import { focusNext, focusPrev, focusFirst, focusLast } from '../../axis/navigate'

// APG Accordion — https://www.w3.org/WAI/ARIA/apg/patterns/accordion/examples/accordion/

export const accordion: AriaPattern = composePattern(
  {
    role: 'region',
    childRole: 'heading',
    focusStrategy: { type: 'natural-tab-order' },
    expandTracking: true,
    visibilityFilter: expandVisibilityFilter,
    panelRole: 'region',
    panelVisibility: 'expanded',
    ariaAttributes: (_node, state: NodeState) => {
      if (state.expanded !== undefined) return { 'aria-expanded': String(state.expanded) }
      return {}
    },
  },
  {
    Enter: toggleExpand,
    Space: toggleExpand,
    ArrowDown: focusNext,
    ArrowUp: focusPrev,
    Home: focusFirst,
    End: focusLast,
    Click: toggleExpand,
  },
)

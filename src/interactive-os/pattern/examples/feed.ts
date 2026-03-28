// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Feed
 * https://www.w3.org/WAI/ARIA/apg/patterns/feed/
 *
 * Feed uses Page Down/Page Up to move between articles.
 * Arrow keys are intentionally NOT captured — they scroll within an article.
 */
import type { StructuredAxis } from '../../axis/types'
import { composePattern } from '../composePattern'

const feedAxis: StructuredAxis = {
  keyMap: {
    PageDown: (ctx) => ctx.focusNext(),
    PageUp: (ctx) => ctx.focusPrev(),
  },
  config: {
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
  },
}

export const feed = composePattern(
  {
    role: 'feed',
    childRole: 'article',
    ariaAttributes: () => ({}),
  },
  feedAxis,
)

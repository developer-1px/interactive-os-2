// V1: 2026-03-28-apg-conformance-prd.md
/**
 * APG Conformance: Feed
 * https://www.w3.org/WAI/ARIA/apg/patterns/feed/
 *
 * Feed uses Page Down/Page Up to move between articles.
 * Arrow keys are intentionally NOT captured — they scroll within an article.
 */
import { composePattern } from '../composePattern'
import { focusNext, focusPrev } from '../../axis/navigate'

export const feed = composePattern(
  {
    role: 'feed',
    childRole: 'article',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    ariaAttributes: () => ({}),
  },
  {
    PageDown: focusNext,
    PageUp: focusPrev,
  },
)

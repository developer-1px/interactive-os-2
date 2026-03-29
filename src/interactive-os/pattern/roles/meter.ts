import { composePattern } from '../composePattern'
import { navigate } from '../../axis/navigate'

// APG Meter — display-only value indicator. No keyboard interaction.
// ariaAttributes: entity.data → aria-value* (data-derived, not axis state)
export const meter = composePattern(
  {
    role: 'none',
    childRole: 'meter',
    ariaAttributes: (node) => {
      const d = node.data as Record<string, unknown> | undefined
      return {
        'aria-valuenow': String(d?.value ?? 0),
        'aria-valuemin': String(d?.min ?? 0),
        'aria-valuemax': String(d?.max ?? 100),
      }
    },
  },
  [navigate('natural')],
  {},
)

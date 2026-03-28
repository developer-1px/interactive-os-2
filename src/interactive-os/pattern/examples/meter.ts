import type { Entity } from '../../store/types'
import { composePattern } from '../composePattern'

// APG Meter: display-only value indicator. No keyboard interaction.
export const meter = composePattern(
  {
    role: 'none',
    childRole: 'meter',
    ariaAttributes: (node: Entity) => ({
      'aria-valuenow': String((node.data as Record<string, unknown>)?.value ?? 0),
      'aria-valuemin': String((node.data as Record<string, unknown>)?.min ?? 0),
      'aria-valuemax': String((node.data as Record<string, unknown>)?.max ?? 100),
    }),
  },
)

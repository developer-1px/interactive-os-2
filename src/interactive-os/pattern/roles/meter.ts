import type { AriaPattern } from '../types'
import type { Entity } from '../../store/types'

// APG Meter — display-only value indicator. No keyboard interaction.
export const meter: AriaPattern = {
  role: 'none',
  childRole: 'meter',
  keyMap: {},
  focusStrategy: { type: 'natural-tab-order', orientation: 'vertical' },
  ariaAttributes: (node: Entity) => ({
    'aria-valuenow': String((node.data as Record<string, unknown>)?.value ?? 0),
    'aria-valuemin': String((node.data as Record<string, unknown>)?.min ?? 0),
    'aria-valuemax': String((node.data as Record<string, unknown>)?.max ?? 100),
  }),
}

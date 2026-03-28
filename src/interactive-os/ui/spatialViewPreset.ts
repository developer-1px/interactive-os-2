import { composePattern } from '../pattern/composePattern'
import type { NodeState } from '../pattern/types'
import type { Entity } from '../store/types'

/**
 * Read-only spatial navigation pattern.
 * No axes — useSpatialNav injects arrow key handlers externally.
 * Only provides roving-tabindex focus management.
 */
export const spatialView = composePattern(
  {
    role: 'group',
    childRole: 'group',
    ariaAttributes: (_node: Entity, state: NodeState) => ({
      'aria-posinset': String(state.index + 1),
      'aria-setsize': String(state.siblingCount),
    }),
  },
  { keyMap: {}, config: { focusStrategy: { type: 'roving-tabindex', orientation: 'both' } } },
)

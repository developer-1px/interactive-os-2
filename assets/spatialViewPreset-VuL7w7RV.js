var e=`import { composePattern } from '../pattern/composePattern'
import { navigate } from '../axis/navigate'
import type { NodeState } from '../pattern/types'
import type { Entity } from '../store/types'

/**
 * Read-only spatial navigation pattern.
 * useSpatialNav injects arrow key handlers externally.
 * navigate('both') provides roving-tabindex focus management.
 */
const nav = navigate('both')

export const spatialView = composePattern(
  {
    role: 'group',
    childRole: 'group',
    ariaAttributes: (_node: Entity, state: NodeState) => ({
      'aria-posinset': String(state.index + 1),
      'aria-setsize': String(state.siblingCount),
    }),
  },
  [nav],
  {},
)
`;export{e as default};
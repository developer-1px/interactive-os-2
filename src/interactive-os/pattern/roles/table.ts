// ② 2026-03-28-checked-axis-childrole-prd.md
import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { expand } from '../../axis/expand'

const ROLE_BY_LEVEL: Record<number, string> = {
  1: 'rowgroup',
  2: 'row',
  3: 'cell',
}

// APG Table: static table with rowgroup > row > cell hierarchy
// Table is non-interactive (natural-tab-order, no keyboard navigation)
// Uses expand() axis to enable visibility gating for nested levels
export const table = composePattern(
  {
    role: 'table',
    childRole: (_entity: Entity, state: NodeState) =>
      ROLE_BY_LEVEL[state.level ?? 1] ?? 'cell',
    ariaAttributes: () => ({}),
  },
  expand(),
)

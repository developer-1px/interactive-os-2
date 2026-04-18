var e=`import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { expanded } from '../../axis/expand'
import { navigate } from '../../axis/navigate'

const ROLE_BY_LEVEL: Record<number, string> = { 1: 'rowgroup', 2: 'row', 3: 'cell' }

// APG Table — static table with rowgroup > row > cell hierarchy
const nav = navigate('natural')
const exp = expanded()

export const table = composePattern(
  {
    role: 'table',
    childRole: (_entity: Entity, state: NodeState) =>
      ROLE_BY_LEVEL[state.level ?? 1] ?? 'cell',
  },
  [nav, exp],
  {},
)
`;export{e as default};
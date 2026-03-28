import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { checked } from '../../axis/checked'

// ② 2026-03-28-checked-axis-childrole-prd.md
export const switchPattern = composePattern(
  {
    role: 'switch',
    childRole: 'switch',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.checked ?? false),
    }),
  },
  checked(),
)

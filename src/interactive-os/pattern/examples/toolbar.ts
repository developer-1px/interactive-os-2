import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { activate } from '../../axis/activate'
import { navigate } from '../../axis/navigate'

export const toolbar = composePattern(
  {
    role: 'toolbar',
    childRole: 'button',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-pressed': String(state.selected),
    }),
  },
  activate({ onClick: true }),
  navigate({ orientation: 'horizontal' }),
)

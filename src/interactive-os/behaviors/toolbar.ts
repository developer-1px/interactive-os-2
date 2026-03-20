import type { NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { activate } from '../axes/activate'
import { navigate } from '../axes/navigate'

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

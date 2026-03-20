import type { NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { activate } from '../axes/activate'
import { navH } from '../axes/navH'

export const toolbar = composePattern(
  {
    role: 'toolbar',
    childRole: 'button',
    focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' },
    activateOnClick: true,
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-pressed': String(state.selected),
    }),
  },
  activate,
  navH(),
)

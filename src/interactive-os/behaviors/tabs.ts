import type { NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { activateFollowFocus } from '../axes/activateFollowFocus'
import { navH } from '../axes/navH'

export const tabs = composePattern(
  {
    role: 'tablist',
    childRole: 'tab',
    focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' },
    selectionMode: 'single',
    activateOnClick: true,
    followFocus: true,
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
  },
  activateFollowFocus,
  navH(),
)

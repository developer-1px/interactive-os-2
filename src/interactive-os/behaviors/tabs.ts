import type { NodeState } from './types'
import { composePattern } from '../axes/compose-pattern'
import { activateFollowFocus } from '../axes/activate-follow-focus'
import { navH } from '../axes/nav-h'

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

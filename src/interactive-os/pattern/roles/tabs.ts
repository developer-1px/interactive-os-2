import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { select } from '../../axis/select'
import { activate } from '../../axis/activate'
import { navigate } from '../../axis/navigate'

export const tabs = composePattern(
  {
    role: 'tablist',
    childRole: 'tab',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
    panelRole: 'tabpanel',
    panelVisibility: 'selected',
  },
  select({ mode: 'single', selectionFollowsFocus: true }),
  activate({ onClick: true, activationFollowsSelection: true }),
  navigate({ orientation: 'horizontal' }),
)

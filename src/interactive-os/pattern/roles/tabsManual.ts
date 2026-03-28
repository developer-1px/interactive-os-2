import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { select } from '../../axis/select'
import { activate } from '../../axis/activate'
import { navigate } from '../../axis/navigate'

// APG Tabs with Manual Activation: Arrow keys move focus only, Enter/Space selects
// Contrast with `tabs` (automatic) which has selectionFollowsFocus + activationFollowsSelection
export const tabsManual = composePattern(
  {
    role: 'tablist',
    childRole: 'tab',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
  },
  select({ mode: 'single' }),
  activate({ onClick: true }),
  navigate({ orientation: 'horizontal' }),
)

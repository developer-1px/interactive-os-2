import type { NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { select } from '../axes/select'
import { activate } from '../axes/activate'
import { navigate } from '../axes/navigate'

export const tabs = composePattern(
  {
    role: 'tablist',
    childRole: 'tab',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-selected': String(state.selected),
    }),
  },
  select({ mode: 'single' }),
  activate({ onClick: true, followFocus: true }),
  navigate({ orientation: 'horizontal' }),
)

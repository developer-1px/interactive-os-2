import type { NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { select } from '../axes/select'
import { activate } from '../axes/activate'
import { navigate } from '../axes/navigate'

export const radiogroup = composePattern(
  {
    role: 'radiogroup',
    childRole: 'radio',
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.selected),
    }),
  },
  select({ mode: 'single' }),
  activate({ onClick: true }),
  navigate({ orientation: 'both', wrap: true }),
)

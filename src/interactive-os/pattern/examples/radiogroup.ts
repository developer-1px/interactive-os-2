import type { NodeState } from './types'
import { composePattern } from './composePattern'
import { select } from '../axis/select'
import { activate } from '../axis/activate'
import { navigate } from '../axis/navigate'

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

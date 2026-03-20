import type { NodeState } from './types'
import { composePattern } from '../axes/compose-pattern'
import { selectToggle } from '../axes/select-toggle'
import { navVhUniform } from '../axes/nav-vh-uniform'

export const radiogroup = composePattern(
  {
    role: 'radiogroup',
    childRole: 'radio',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    selectionMode: 'single',
    activateOnClick: true,
    ariaAttributes: (_node, state: NodeState) => ({
      'aria-checked': String(state.selected),
    }),
  },
  selectToggle,
  navVhUniform({ wrap: true }),
)

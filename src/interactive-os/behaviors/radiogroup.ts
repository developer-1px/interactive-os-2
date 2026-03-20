import type { NodeState } from './types'
import { composePattern } from '../axes/composePattern'
import { selectToggle } from '../axes/selectToggle'
import { navVhUniform } from '../axes/navVhUniform'

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

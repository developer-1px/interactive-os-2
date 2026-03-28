import type { NodeState } from '../types'
import type { Entity } from '../../store/types'
import { composePattern } from '../composePattern'
import { select } from '../../axis/select'
import { activate } from '../../axis/activate'
import { navigate } from '../../axis/navigate'

export function listbox() {
  return composePattern(
    {
      role: 'listbox',
      childRole: 'option',
      ariaAttributes: (_node: Entity, state: NodeState) => {
        const attrs: Record<string, string> = {
          'aria-selected': String(state.selected),
          'aria-posinset': String(state.index + 1),
          'aria-setsize': String(state.siblingCount),
        }
        return attrs
      },
    },
    select({ mode: 'multiple', extended: true }),
    activate({ onClick: true }),
    navigate({ orientation: 'vertical' }),
  )
}

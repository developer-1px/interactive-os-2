import type { NodeState } from '../types'
import type { Entity } from '../../store/types'
import { composePattern } from '../composePattern'
import { select } from '../../axis/select'
import { activate } from '../../axis/activate'
import { expand } from '../../axis/expand'
import { navigate } from '../../axis/navigate'

export function treegrid() {
  return composePattern(
    {
      role: 'treegrid',
      childRole: 'row',
      ariaAttributes: (_node: Entity, state: NodeState) => {
        const attrs: Record<string, string> = {
          'aria-selected': String(state.selected),
          'aria-posinset': String(state.index + 1),
          'aria-setsize': String(state.siblingCount),
        }
        if (state.expanded !== undefined) {
          attrs['aria-expanded'] = String(state.expanded)
        }
        if (state.level !== undefined) {
          attrs['aria-level'] = String(state.level)
        }
        return attrs
      },
    },
    select({ mode: 'multiple', extended: true }),
    activate({ onClick: true }),
    expand({ mode: 'arrow' }),
    navigate({ orientation: 'vertical' }),
  )
}

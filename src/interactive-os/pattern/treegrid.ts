import type { NodeState } from './types'
import type { Entity } from '../store/types'
import { composePattern } from './composePattern'
import { select } from '../axis/select'
import { activate } from '../axis/activate'
import { expand } from '../axis/expand'
import { navigate } from '../axis/navigate'
import { edit as editAxis } from '../plugins/edit'

export function treegrid(options?: { edit?: boolean }) {
  const axes = [
    ...(options?.edit ? [editAxis({ tree: true })] : []),
    select({ mode: 'multiple', extended: true }),
    activate({ onClick: true }),
    expand({ mode: 'arrow' }),
    navigate({ orientation: 'vertical' }),
  ]
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
    ...axes,
  )
}

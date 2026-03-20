import type { NodeState } from './types'
import type { Entity } from '../core/types'
import { composePattern } from '../axes/composePattern'
import { select } from '../axes/select'
import { activate } from '../axes/activate'
import { expand } from '../axes/expand'
import { navigate } from '../axes/navigate'

export const tree = composePattern(
  {
    role: 'tree',
    childRole: 'treeitem',
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
  activate(),
  expand({ mode: 'arrow' }),
  navigate({ orientation: 'vertical' }),
)

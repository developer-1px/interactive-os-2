import type { NodeState } from './types'
import type { Entity } from '../core/types'
import { composePattern } from '../axes/composePattern'
import { select } from '../axes/select'
import { activate } from '../axes/activate'
import { navigate } from '../axes/navigate'
import { edit as editAxis } from '../axes/edit'

export function listbox(options?: { edit?: boolean }) {
  const axes = [
    ...(options?.edit ? [editAxis()] : []),
    select({ mode: 'multiple', extended: true }),
    activate({ onClick: true }),
    navigate({ orientation: 'vertical' }),
  ]
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
    ...axes,
  )
}

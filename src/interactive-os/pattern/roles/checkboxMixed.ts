// ② 2026-03-28-checked-axis-childrole-prd.md
import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import type { Axis } from '../../axis/types'
import { composePattern } from '../composePattern'
import { checked } from '../../axis/checked'
import { navigate } from '../../axis/navigate'

// APG Checkbox Mixed-State: parent reflects aggregate child state
// Parent: aria-checked = true|false|mixed (derived from children)
// Children: aria-checked = true|false (direct toggle)
//
// alwaysDescend: VisibilityFilter that makes container nodes focusable and always shows their children.
// Required because without a shouldDescend filter, getVisibleNodes skips container nodes entirely.
const alwaysDescend: Axis = {
  keyMap: {},
  visibilityFilter: {
    shouldDescend: () => true,
  },
}

export const checkboxMixed = composePattern(
  {
    role: 'group',
    childRole: 'checkbox',
    ariaAttributes: (_node: Entity, state: NodeState) => ({
      'aria-checked': String(state.checked ?? false),
    }),
  },
  checked(),
  alwaysDescend,
  navigate({ wrap: false }),
)

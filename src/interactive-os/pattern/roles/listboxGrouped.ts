import type { Entity } from '../../store/types'
import type { AriaPattern, NodeState } from '../types'
import { composePattern } from '../composePattern'
import { navigate } from '../../axis/navigate'
import { selected } from '../../axis/select'
import { activateHandler } from '../../axis/activate'

// APG Listbox with Grouped Options
const nav = navigate('vertical')
const sel = selected('single', { followFocus: true })

export const listboxGrouped: AriaPattern = composePattern(
  {
    role: 'listbox',
    childRole: (_entity: Entity, state: NodeState) =>
      (state.level ?? 1) === 1 ? 'group' : 'option',
  },
  [nav, sel],
  {
    ArrowDown: nav.next,
    ArrowUp: nav.prev,
    Home: nav.first,
    End: nav.last,
    Enter: activateHandler,
    Click: sel.selectAndAnchor,
  },
)

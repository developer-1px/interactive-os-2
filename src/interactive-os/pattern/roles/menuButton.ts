// ② 2026-03-28-popup-axis-prd.md
import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import { composePattern } from '../composePattern'
import { popup } from '../../axis/popup'
import { navigate } from '../../axis/navigate'
import { activate } from '../../axis/activate'

const pop = popup({ type: 'menu' })

export const menuButton = composePattern(
  {
    role: 'menu',
    childRole: 'menuitem',
    ariaAttributes: (_node: Entity, _state: NodeState) => ({}),
    triggerKeyMap: {
      Enter: pop.keyMap.Enter,
      Space: pop.keyMap.Space,
      ArrowDown: pop.keyMap.ArrowDown,
      ArrowUp: pop.keyMap.ArrowUp,
    },
  },
  pop,
  navigate({ orientation: 'vertical', wrap: true }),
  activate({ onClick: true }),
)

import type { Entity } from '../../store/types'
import type { AriaPattern, NodeState } from '../types'
import { composePattern } from '../composePattern'
import { focusNext, focusPrev, focusFirst, focusLast } from '../../axis/navigate'
import { selectionCommands } from '../../axis/select'
import { selectConfig } from '../../axis/select'
import { activateHandler } from '../../axis/activate'
import type { PatternContext } from '../../axis/types'
import type { Command } from '../../engine/types'
import { createBatchCommand } from '../../engine/types'

// APG Listbox with Grouped Options
// https://www.w3.org/WAI/ARIA/apg/patterns/listbox/examples/listbox-grouped/
// Groups at level 1 (role="group"), options at level 2+ (role="option")

const selectAndAnchor = (ctx: PatternContext): Command =>
  createBatchCommand([
    selectionCommands.select(ctx.focused),
    selectionCommands.setAnchor(ctx.focused),
  ])

export const listboxGrouped: AriaPattern = composePattern(
  {
    role: 'listbox',
    childRole: (_entity: Entity, state: NodeState) =>
      (state.level ?? 1) === 1 ? 'group' : 'option',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    selectionMode: 'single',
  },
  selectConfig({ mode: 'single', selectionFollowsFocus: true }),
  {
    // Navigation — APG: Down/Up moves focus and selects
    ArrowDown: focusNext,
    ArrowUp: focusPrev,
    Home: focusFirst,
    End: focusLast,

    // Activation
    Enter: activateHandler,

    // Pointer
    Click: selectAndAnchor,
  },
)

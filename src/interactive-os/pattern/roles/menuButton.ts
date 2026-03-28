// ② 2026-03-28-popup-axis-prd.md
import type { Entity } from '../../store/types'
import type { NodeState } from '../types'
import type { PatternContext } from '../../axis/types'
import type { Command } from '../../engine/types'
import { composePattern } from '../composePattern'
import { openPopup, closePopup, openAndFocusFirst, openAndFocusLast, popupVisibilityFilter } from '../../axis/popup'
import { focusFirst, focusLast } from '../../axis/navigate'
import { activateConfig, activateHandler } from '../../axis/activate'

// Popup-then-activate chain: when popup is closed, open it; when open, activate item
const openOrActivate = (ctx: PatternContext): Command | void =>
  openPopup(ctx) ?? activateHandler(ctx)

// Popup-then-navigate chain: when popup is closed, open+focus first; when open, navigate
const openFirstOrFocusNext = (ctx: PatternContext): Command | void =>
  openAndFocusFirst(ctx) ?? ctx.focusNext({ wrap: true })

const openLastOrFocusPrev = (ctx: PatternContext): Command | void =>
  openAndFocusLast(ctx) ?? ctx.focusPrev({ wrap: true })

export const menuButton = composePattern(
  {
    role: 'menu',
    childRole: 'menuitem',
    focusStrategy: { type: 'roving-tabindex', orientation: 'vertical' },
    ariaAttributes: (_node: Entity, _state: NodeState) => ({}),
    popupType: 'menu',
    visibilityFilter: popupVisibilityFilter,
    triggerKeyMap: {
      Enter: openPopup,
      Space: openPopup,
      ArrowDown: openAndFocusFirst,
      ArrowUp: openAndFocusLast,
    },
  },
  activateConfig(),
  {
    // Navigation + popup open — vertical wrap
    ArrowDown: openFirstOrFocusNext,
    ArrowUp: openLastOrFocusPrev,
    Home: focusFirst,
    End: focusLast,

    // Popup close
    Escape: closePopup,

    // Activation + popup open
    Enter: openOrActivate,
    Space: openOrActivate,
  },
)

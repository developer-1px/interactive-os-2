import type { AriaPattern, NodeState } from '../pattern/types'
import type { PatternContext } from '../axis/types'
import { ROOT_ID } from '../store/types'
import { SPATIAL_PARENT_ID } from '../plugins/spatial'
import { focusCommands, focusNext, focusPrev, focusFirst, focusLast } from '../axis/navigate'
import { composePattern } from '../pattern/composePattern'
import { selectConfig } from '../axis/select'
import { expandConfig } from '../axis/expand'
import { toggleSelect, extendSelectionNext, extendSelectionPrev, extendSelectionFirst, extendSelectionLast, extendSelectionToFocused, selectionCommands } from '../axis/select'
import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'

// Re-export spatial plugin for consumers that use this pattern
export { spatial as spatialPlugin } from '../plugins/spatial'

const selectAndAnchor = (ctx: PatternContext): Command =>
  createBatchCommand([
    selectionCommands.select(ctx.focused),
    selectionCommands.setAnchor(ctx.focused),
  ])

export const spatial: AriaPattern = composePattern(
  {
    role: 'group',
    childRole: 'group',
    focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
    ariaAttributes: (node, state: NodeState) => {
      const d = (node.data ?? {}) as Record<string, string>
      const label = d.name || d.label || d.title || d.value || d.variant || ''
      return {
        'aria-level': String(state.level ?? 1),
        ...(label ? { 'aria-label': label } : {}),
        ...(state.selected ? { 'aria-selected': 'true' } : {}),
      }
    },
  },
  selectConfig({ mode: 'multiple' }),
  expandConfig(),
  { keyMap: {}, config: { activateOnClick: true, expandOnParentClick: true } },
  {
    // Navigation
    ArrowDown: focusNext,
    ArrowUp: focusPrev,

    // Expand (enter-esc mode)
    Enter: (ctx: PatternContext) => ctx.activate(),
    Escape: (ctx: PatternContext) => (ctx.isExpanded ? ctx.collapse() : ctx.focusParent()),

    // Selection
    Space: toggleSelect,
    'Shift+ArrowDown': extendSelectionNext,
    'Shift+ArrowUp': extendSelectionPrev,
    'Shift+Home': extendSelectionFirst,
    'Shift+End': extendSelectionLast,

    // Pointer
    Click: selectAndAnchor,
    'Shift+Click': extendSelectionToFocused,
    'Mod+Click': toggleSelect,

    // Spatial Home/End (depth-scoped)
    Home: (ctx: PatternContext) => {
      const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
      const depthParentId = (spatialParent?.parentId as string) ?? ROOT_ID
      const siblings = ctx.getChildren(depthParentId)
      if (siblings.length > 0) return focusCommands.setFocus(siblings[0]!)
      return focusFirst(ctx)
    },
    End: (ctx: PatternContext) => {
      const spatialParent = ctx.getEntity(SPATIAL_PARENT_ID)
      const depthParentId = (spatialParent?.parentId as string) ?? ROOT_ID
      const siblings = ctx.getChildren(depthParentId)
      if (siblings.length > 0) return focusCommands.setFocus(siblings[siblings.length - 1]!)
      return focusLast(ctx)
    },
  },
)

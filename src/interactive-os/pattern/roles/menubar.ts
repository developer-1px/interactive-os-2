import type { PatternContext } from '../../axis/types'
import type { Command } from '../../engine/types'
import { createBatchCommand } from '../../engine/types'
import { composePattern } from '../composePattern'
import { expandConfig, expandCommands, EXPANDED_ID } from '../../axis/expand'
import { focusCommands } from '../../axis/navigate'
import { activateHandler } from '../../axis/activate'
import { ROOT_ID } from '../../store/types'

// APG Navigation Menubar
// https://www.w3.org/WAI/ARIA/apg/patterns/menubar/examples/menubar-navigation/

// ── Helpers ──

function isMenubarLevel(ctx: PatternContext): boolean {
  return ctx.getChildren(ROOT_ID).includes(ctx.focused)
}

function getExpandedSet(ctx: PatternContext): Set<string> {
  const entity = ctx.getEntity(EXPANDED_ID)
  const ids = (entity?.expandedIds as string[]) ?? []
  return new Set(ids)
}

/** Collapse siblings + their descendants, then expand nodeId and focus first/last child. */
function openExclusive(
  ctx: PatternContext, nodeId: string, parentId: string, focusLast = false,
): Command {
  const siblings = ctx.getChildren(parentId)
  const expanded = getExpandedSet(ctx)
  const commands: Command[] = []

  for (const sib of siblings) {
    if (sib !== nodeId && expanded.has(sib)) {
      commands.push(expandCommands.collapse(sib))
      collapseDescendants(ctx, sib, expanded, commands)
    }
  }

  commands.push(expandCommands.expand(nodeId))
  const children = ctx.getChildren(nodeId)
  if (children.length > 0) {
    commands.push(focusCommands.setFocus(
      focusLast ? children[children.length - 1]! : children[0]!,
    ))
  }
  return createBatchCommand(commands)
}

/** Recursively collapse all expanded descendants of a node. */
function collapseDescendants(
  ctx: PatternContext, nodeId: string, expanded: Set<string>, commands: Command[],
): void {
  for (const childId of ctx.getChildren(nodeId)) {
    if (expanded.has(childId)) {
      commands.push(expandCommands.collapse(childId))
      collapseDescendants(ctx, childId, expanded, commands)
    }
  }
}

/** Close a submenu and return focus to its parent. */
function closeSubmenu(ctx: PatternContext): Command | void {
  const parentId = ctx.getParent(ctx.focused)
  if (!parentId) return undefined
  const expanded = getExpandedSet(ctx)
  const commands: Command[] = [expandCommands.collapse(parentId)]
  collapseDescendants(ctx, parentId, expanded, commands)
  commands.push(focusCommands.setFocus(parentId))
  return createBatchCommand(commands)
}

function findRootAncestor(ctx: PatternContext): string {
  let current = ctx.focused
  let parent = ctx.getParent(current)
  while (parent && parent !== ROOT_ID) {
    current = parent
    parent = ctx.getParent(current)
  }
  return current
}

/** Close all submenus, advance to next/prev menubar item, open its submenu.
 *  APG: focus stays on the menubar item (submenu is open but not focused into). */
function advanceMenubar(ctx: PatternContext, direction: 1 | -1): Command {
  const roots = ctx.getChildren(ROOT_ID)
  const expanded = getExpandedSet(ctx)
  const rootAncestor = findRootAncestor(ctx)
  const idx = roots.indexOf(rootAncestor)
  const next = roots[(idx + direction + roots.length) % roots.length]!

  const commands: Command[] = []
  for (const id of expanded) {
    commands.push(expandCommands.collapse(id))
  }

  // Open submenu but keep focus on the menubar item (APG behavior)
  const nextChildren = ctx.getChildren(next)
  if (nextChildren.length > 0) {
    commands.push(expandCommands.expand(next))
  }
  commands.push(focusCommands.setFocus(next))
  return createBatchCommand(commands)
}

function focusSubmenuSibling(ctx: PatternContext, direction: 1 | -1): Command {
  const parentId = ctx.getParent(ctx.focused)
  if (!parentId) return focusCommands.setFocus(ctx.focused)
  const siblings = ctx.getChildren(parentId)
  const idx = siblings.indexOf(ctx.focused)
  const next = siblings[(idx + direction + siblings.length) % siblings.length]!
  return focusCommands.setFocus(next)
}

// ── APG Keyboard Handlers ──

// APG §Menubar: Right Arrow moves to next menubar item (wraps).
// If submenu is open, closes all and opens next item's submenu.
const arrowRight = (ctx: PatternContext): Command | void => {
  if (isMenubarLevel(ctx)) {
    const expanded = getExpandedSet(ctx)
    const roots = ctx.getChildren(ROOT_ID)
    if (roots.some(id => expanded.has(id))) return advanceMenubar(ctx, 1)
    return ctx.focusNext({ wrap: true })
  }

  // Submenu item with children → open nested submenu
  const children = ctx.getChildren(ctx.focused)
  if (children.length > 0) {
    return openExclusive(ctx, ctx.focused, ctx.getParent(ctx.focused)!)
  }
  // Leaf → advance to next menubar item's submenu
  return advanceMenubar(ctx, 1)
}

// APG §Menubar: Left Arrow moves to previous menubar item (wraps).
// In nested submenu: close it. In top submenu: retreat menubar.
const arrowLeft = (ctx: PatternContext): Command | void => {
  if (isMenubarLevel(ctx)) {
    const expanded = getExpandedSet(ctx)
    const roots = ctx.getChildren(ROOT_ID)
    if (roots.some(id => expanded.has(id))) return advanceMenubar(ctx, -1)
    return ctx.focusPrev({ wrap: true })
  }

  const parentId = ctx.getParent(ctx.focused)
  if (!parentId) return undefined
  const parentOfParent = ctx.getParent(parentId)

  // Nested submenu → close it, focus parent item
  if (parentOfParent && parentOfParent !== ROOT_ID) return closeSubmenu(ctx)
  // Top-level submenu → retreat menubar
  return advanceMenubar(ctx, -1)
}

// APG §Menubar: Down Arrow opens submenu, focuses first item.
const arrowDown = (ctx: PatternContext): Command | void => {
  if (isMenubarLevel(ctx)) {
    if (ctx.getChildren(ctx.focused).length > 0) {
      return openExclusive(ctx, ctx.focused, ROOT_ID)
    }
    return undefined
  }
  return focusSubmenuSibling(ctx, 1)
}

// APG §Menubar: Up Arrow opens submenu, focuses last item.
const arrowUp = (ctx: PatternContext): Command | void => {
  if (isMenubarLevel(ctx)) {
    if (ctx.getChildren(ctx.focused).length > 0) {
      return openExclusive(ctx, ctx.focused, ROOT_ID, true)
    }
    return undefined
  }
  return focusSubmenuSibling(ctx, -1)
}

// APG §Menubar: Enter/Space opens submenu or activates leaf.
const enterSpace = (ctx: PatternContext): Command | void => {
  if (ctx.getChildren(ctx.focused).length > 0) {
    const parentId = isMenubarLevel(ctx) ? ROOT_ID : ctx.getParent(ctx.focused)!
    return openExclusive(ctx, ctx.focused, parentId)
  }
  return activateHandler(ctx)
}

// APG §Menubar: Escape closes submenu, returns focus to parent.
const escape = (ctx: PatternContext): Command | void => {
  if (isMenubarLevel(ctx)) return undefined
  return closeSubmenu(ctx)
}

// APG §Menubar: Home/End moves to first/last item at current level.
const home = (ctx: PatternContext): Command => {
  if (isMenubarLevel(ctx)) return ctx.focusFirst()
  const parentId = ctx.getParent(ctx.focused)
  if (!parentId) return ctx.focusFirst()
  const siblings = ctx.getChildren(parentId)
  return focusCommands.setFocus(siblings[0] ?? ctx.focused)
}

const end = (ctx: PatternContext): Command => {
  if (isMenubarLevel(ctx)) return ctx.focusLast()
  const parentId = ctx.getParent(ctx.focused)
  if (!parentId) return ctx.focusLast()
  const siblings = ctx.getChildren(parentId)
  return focusCommands.setFocus(siblings[siblings.length - 1] ?? ctx.focused)
}

// ── Pattern ──

export const menubar = composePattern(
  {
    role: 'menubar',
    childRole: 'menuitem',
    focusStrategy: { type: 'roving-tabindex', orientation: 'horizontal' },
  },
  expandConfig(),
  {
    ArrowRight: arrowRight,
    ArrowLeft: arrowLeft,
    ArrowDown: arrowDown,
    ArrowUp: arrowUp,
    Enter: enterSpace,
    Space: enterSpace,
    Escape: escape,
    Home: home,
    End: end,
  },
)

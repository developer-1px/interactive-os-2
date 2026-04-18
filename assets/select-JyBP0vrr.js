var e=`import type { EntityDecl, SelectedNav } from './types'
import type { SelectionMode } from './types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { key } from './types'
import { type Command, type Middleware, createBatchCommand } from '../engine/types'
import { focusCommands } from '../core'
import { activateCommands } from '../core'
import {
  SELECTION_ID, SELECTION_ANCHOR_ID, selectionCommands,
} from '../core'
import type { NormalizedData } from '../store/types'

// Re-export for backwards compatibility during migration
export { SELECTION_ID, SELECTION_ANCHOR_ID, selectionCommands }

function getSelectedIds(store: NormalizedData): string[] {
  return (store.entities[SELECTION_ID]?.selectedIds as string[]) ?? []
}

export const selectAndAnchor = key(['core:focus', 'core:select-range', 'core:set-anchor'], (ctx) =>
  createBatchCommand([focusCommands.setFocus(ctx.focused), selectionCommands.select(ctx.focused), selectionCommands.setAnchor(ctx.focused)]))

/**
 * Middleware that clears the selection anchor when a standalone focus command fires.
 * This ensures Shift+Arrow starts fresh after normal navigation.
 * Batch commands (selectAndAnchor, extendSelection) are exempt — the anchor persists within a batch.
 */
function anchorResetMiddleware(): Middleware {
  return (next, _getStore) => (command) => {
    next(command)
    if (command.type === 'core:focus') {
      next(selectionCommands.clearAnchor())
    }
  }
}

/**
 * Middleware: auto-select the focused node on standalone focus commands.
 * Batch commands (e.g. extendSelection) are exempt — they manage selection themselves.
 * APG "selection follows focus": RadioGroup, Tabs automatic.
 */
export function selectionFollowsFocusMiddleware(activateOnSelect?: boolean): Middleware {
  return (next, _getStore) => (command) => {
    next(command)
    if (command.type === 'core:focus') {
      const nodeId = (command.payload as { nodeId: string }).nodeId
      next(selectionCommands.select(nodeId))
      if (activateOnSelect) {
        next(activateCommands.activate(nodeId))
      }
    }
  }
}



// ② 2026-03-29-ctx-axis-namespace-prd.md
export function selectedCtx(
  engine: CommandEngine,
  focusedId: string,
  visibleNodes: () => string[],
  mode?: SelectionMode,
): SelectedNav {
  const store = engine.getStore()
  const ids = getSelectedIds(store)
  return {
    ids,
    toggle: () => mode === 'single'
      ? selectionCommands.select(focusedId)
      : selectionCommands.toggleSelect(focusedId),
    range: (nodeIds: string[]) => selectionCommands.selectRange(nodeIds),
    extend(direction: 'next' | 'prev' | 'first' | 'last'): Command {
      const visible = visibleNodes()
      const idx = visible.indexOf(focusedId)
      let targetId: string
      switch (direction) {
        case 'next': targetId = visible[idx + 1] ?? focusedId; break
        case 'prev': targetId = visible[idx - 1] ?? focusedId; break
        case 'first': targetId = visible[0] ?? focusedId; break
        case 'last': targetId = visible[visible.length - 1] ?? focusedId; break
      }
      if (mode === 'single') return focusCommands.setFocus(targetId)
      const anchorId = (store.entities[SELECTION_ANCHOR_ID]?.anchorId as string) ?? focusedId
      const anchorIdx = visible.indexOf(anchorId)
      const targetIdx = visible.indexOf(targetId)
      const start = Math.min(anchorIdx, targetIdx)
      const end = Math.max(anchorIdx, targetIdx)
      const rangeIds = visible.slice(start, end + 1)
      const commands: Command[] = []
      if (!store.entities[SELECTION_ANCHOR_ID]) {
        commands.push(selectionCommands.setAnchor(focusedId))
      }
      commands.push(focusCommands.setFocus(targetId))
      commands.push(selectionCommands.selectRange(rangeIds))
      return createBatchCommand(commands)
    },
    extendTo(targetId: string, navigableIds?: string[]): Command {
      const nodeList = navigableIds ?? visibleNodes()
      const anchorId = (store.entities[SELECTION_ANCHOR_ID]?.anchorId as string) ?? focusedId
      const anchorIdx = nodeList.indexOf(anchorId)
      const targetIdx = nodeList.indexOf(targetId)
      if (targetIdx === -1) return focusCommands.setFocus(focusedId)
      const start = Math.min(anchorIdx, targetIdx)
      const end = Math.max(anchorIdx, targetIdx)
      const rangeIds = nodeList.slice(start, end + 1)
      const commands: Command[] = []
      if (!store.entities[SELECTION_ANCHOR_ID]) {
        commands.push(selectionCommands.setAnchor(focusedId))
      }
      commands.push(focusCommands.setFocus(targetId))
      commands.push(selectionCommands.selectRange(rangeIds))
      return createBatchCommand(commands)
    },
  }
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
export function selected(mode: SelectionMode, opts?: { followFocus?: boolean; activateOnSelect?: boolean }) {
  const middlewares: Middleware[] = [anchorResetMiddleware()]
  if (opts?.followFocus) middlewares.push(selectionFollowsFocusMiddleware(opts?.activateOnSelect))
  const middleware: Middleware = middlewares.length === 1
    ? middlewares[0]!
    : (next, getStore) => middlewares.reduceRight<(command: Command) => void>((acc, mw) => mw(acc, getStore), next)

  const toggle = key(['core:toggle-select'], (ctx) => ctx.selected?.toggle())
  const extendNext = key(['core:focus', 'core:select-range'], (ctx) => ctx.selected?.extend('next'))
  const extendPrev = key(['core:focus', 'core:select-range'], (ctx) => ctx.selected?.extend('prev'))
  const extendFirst = key(['core:focus', 'core:select-range'], (ctx) => ctx.selected?.extend('first'))
  const extendLast = key(['core:focus', 'core:select-range'], (ctx) => ctx.selected?.extend('last'))
  const _selectAndAnchor = selectAndAnchor
  const extendToFocused = key(['core:focus', 'core:select-range'], (ctx) => ctx.selected?.extendTo(ctx.focused))

  return {
    keyMap: {} as Record<string, never>,
    entities: [{ id: SELECTION_ID, default: { selectedIds: [] } }] as EntityDecl[],
    middleware,
    ctxFactory: ((engine, focusedId, visibleNodes) => ({
      selected: selectedCtx(engine, focusedId, visibleNodes, mode),
    })) as import('./types').CtxFactory,
    meta: {
      selectionMode: mode,
      ...(opts?.followFocus && { selectionFollowsFocus: true }),
      ...(opts?.activateOnSelect && { activationFollowsSelection: true }),
    },
    ariaGen: ((s, _e, role) => {
      const attr = (role === 'radio' || role === 'menuitemradio')
        ? 'aria-checked'
        : role === 'button' ? 'aria-pressed' : 'aria-selected'
      return { [attr]: String(s.selected ?? false) }
    }) as import('./types').AriaGen,
    // handlers
    toggle,
    extendNext,
    extendPrev,
    extendFirst,
    extendLast,
    selectAndAnchor: _selectAndAnchor,
    extendToFocused,
    // preset keyMap fragments
    keys: {
      'Shift+ArrowDown': extendNext,
      'Shift+ArrowUp': extendPrev,
      'Shift+Home': extendFirst,
      'Shift+End': extendLast,
    } as Record<string, import('./types').KeyHandler>,
    clickKeys: {
      Click: _selectAndAnchor,
      'Shift+Click': extendToFocused,
      'Mod+Click': toggle,
    } as Record<string, import('./types').KeyHandler>,
  }
}
`;export{e as default};
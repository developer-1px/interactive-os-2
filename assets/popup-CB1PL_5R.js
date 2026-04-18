var e=`// ② 2026-03-29-compose-pattern-3arg-prd.md
import type { PatternContext, EntityDecl, CtxFactory, PopupNav } from './types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { key } from './types'
import type { Command, VisibilityFilter } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import { focusCommands } from '../core'
import { POPUP_ID, popupCommands, getPopupEntity } from '../core'
import { activateHandler } from './activate'

// Re-export for backwards compatibility during migration
export { POPUP_ID, popupCommands }

export const popupVisibilityFilter: VisibilityFilter = {
  shouldDescend(nodeId, store) {
    const entity = store.entities[POPUP_ID]
    if (!entity) return false
    const isOpen = (entity.isOpen as boolean) ?? false
    const triggerId = (entity.triggerId as string) ?? ''
    if (nodeId === triggerId) return isOpen
    return false
  },
}

function popupCtx(
  engine: CommandEngine,
  focusedId: string,
): PopupNav {
  const store = engine.getStore()
  const { isOpen, triggerId } = getPopupEntity(store)
  const children = store.relationships[focusedId] ?? []
  return {
    isOpen,
    open(): Command {
      const cmds: Command[] = [popupCommands.open(focusedId)]
      if (children.length > 0) cmds.push(focusCommands.setFocus(children[0]!))
      return createBatchCommand(cmds)
    },
    close(): Command {
      const target = triggerId ?? focusedId
      return createBatchCommand([popupCommands.close(), focusCommands.setFocus(target)])
    },
  }
}

// ── Private helpers (used by popup() instance handlers) ──

function readPopup(ctx: PatternContext): { isOpen: boolean; triggerId: string | undefined } {
  const entity = ctx.getEntity(POPUP_ID)
  return {
    isOpen: (entity?.isOpen as boolean) ?? false,
    triggerId: entity?.triggerId as string | undefined,
  }
}

function _openPopup(ctx: PatternContext): Command | void {
  const { isOpen } = readPopup(ctx)
  const children = ctx.getChildren(ctx.focused)
  if (!isOpen && children.length > 0) {
    return createBatchCommand([popupCommands.open(ctx.focused), focusCommands.setFocus(children[0])])
  }
}

function _closePopup(ctx: PatternContext): Command | void {
  const { isOpen, triggerId } = readPopup(ctx)
  if (isOpen) {
    if (triggerId) return createBatchCommand([popupCommands.close(), focusCommands.setFocus(triggerId)])
    return popupCommands.close()
  }
}

function _openAndFocusFirst(ctx: PatternContext): Command | void {
  const children = ctx.getChildren(ctx.focused)
  if (children.length > 0) {
    return createBatchCommand([popupCommands.open(ctx.focused), focusCommands.setFocus(children[0])])
  }
}

function _openAndFocusLast(ctx: PatternContext): Command | void {
  const children = ctx.getChildren(ctx.focused)
  if (children.length > 0) {
    return createBatchCommand([popupCommands.open(ctx.focused), focusCommands.setFocus(children[children.length - 1])])
  }
}

// ── Axis instance ──

export function popup(type: 'menu' | 'listbox' | 'grid' | 'tree' | 'dialog', opts?: { modal?: boolean }) {
  const open_ = key(['core:open', 'core:focus'], (ctx) => _openPopup(ctx))
  const close_ = key(['core:close', 'core:focus'], (ctx) => _closePopup(ctx))
  const openOrActivate_ = key(['core:open', 'core:focus', 'core:activate'], (ctx) => _openPopup(ctx) ?? activateHandler(ctx))
  const openFirstOrFocusNext_ = key(['core:open', 'core:focus'], (ctx) =>
    _openAndFocusFirst(ctx) ?? ctx.focusNext({ wrap: true }))
  const openLastOrFocusPrev_ = key(['core:open', 'core:focus'], (ctx) =>
    _openAndFocusLast(ctx) ?? ctx.focusPrev({ wrap: true }))

  return {
    keyMap: {} as Record<string, never>,
    entities: [{ id: POPUP_ID, default: { isOpen: false, triggerId: '' } }] as EntityDecl[],
    visibilityFilter: popupVisibilityFilter,
    ctxFactory: ((engine, focusedId) => ({
      popup: popupCtx(engine, focusedId),
    })) as CtxFactory,
    meta: {
      popupType: type,
      ...(opts?.modal && { popupModal: true }),
    },
    stateGen: ((id, store, children) => {
      const { isOpen, triggerId } = getPopupEntity(store)
      if (triggerId === id) return { open: isOpen }
      if (children.length > 0) return { open: false }
      return {}
    }) as import('./types').StateGen,
    ariaGen: ((s) => {
      if (s.open === undefined) return {}
      return { 'aria-haspopup': type, 'aria-expanded': String(s.open) }
    }) as import('./types').AriaGen,
    // handlers
    open: open_,
    close: close_,
    openOrActivate: openOrActivate_,
    openFirstOrFocusNext: openFirstOrFocusNext_,
    openLastOrFocusPrev: openLastOrFocusPrev_,
    // trigger preset
    triggerKeys: {
      Enter: open_,
      Space: open_,
      ArrowDown: key(['core:open', 'core:focus'], (ctx) => _openAndFocusFirst(ctx)),
      ArrowUp: key(['core:open', 'core:focus'], (ctx) => _openAndFocusLast(ctx)),
    } as Record<string, import('./types').KeyHandler>,
  }
}
`;export{e as default};
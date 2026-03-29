// ② 2026-03-29-compose-pattern-3arg-prd.md
import type { PatternContext, EntityDecl, CtxFactory } from './types'
import type { Command, VisibilityFilter } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { focusCommands } from './navigate'
import { defineCommands } from '../engine/defineCommand'
import { activateHandler } from './activate'

export const POPUP_ID = '__popup__'

interface PopupEntity {
  isOpen: boolean
  triggerId: string | undefined
}

function getPopupEntity(store: NormalizedData): PopupEntity {
  const entity = store.entities[POPUP_ID]
  return {
    isOpen: (entity?.isOpen as boolean) ?? false,
    triggerId: entity?.triggerId as string | undefined,
  }
}

export const popupCommands = defineCommands({
  open: {
    type: 'core:open' as const,
    meta: true,
    create: (triggerId: string) => ({ triggerId }),
    handler: (store, { triggerId }) => {
      const current = getPopupEntity(store)
      if (current.isOpen && current.triggerId === triggerId) return store
      return {
        ...store,
        entities: {
          ...store.entities,
          [POPUP_ID]: { id: POPUP_ID, isOpen: true, triggerId },
        },
      }
    },
  },

  close: {
    type: 'core:close' as const,
    meta: true,
    handler: (store) => {
      const current = getPopupEntity(store)
      return {
        ...store,
        entities: {
          ...store.entities,
          [POPUP_ID]: { id: POPUP_ID, isOpen: false, triggerId: current.triggerId },
        },
      }
    },
  },
})

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
  engine: import('../engine/createCommandEngine').CommandEngine,
  focusedId: string,
): import('./types').PopupNav {
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

function readPopup(ctx: PatternContext): PopupEntity {
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
  const open_ = (ctx: PatternContext): Command | void => _openPopup(ctx)
  const close_ = (ctx: PatternContext): Command | void => _closePopup(ctx)
  const openOrActivate_ = (ctx: PatternContext): Command | void => _openPopup(ctx) ?? activateHandler(ctx)
  const openFirstOrFocusNext_ = (ctx: PatternContext): Command | void =>
    _openAndFocusFirst(ctx) ?? ctx.focusNext({ wrap: true })
  const openLastOrFocusPrev_ = (ctx: PatternContext): Command | void =>
    _openAndFocusLast(ctx) ?? ctx.focusPrev({ wrap: true })

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
      ArrowDown: (ctx: PatternContext): Command | void => _openAndFocusFirst(ctx),
      ArrowUp: (ctx: PatternContext): Command | void => _openAndFocusLast(ctx),
    } as Record<string, (ctx: PatternContext) => Command | void>,
  }
}

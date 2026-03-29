// ② 2026-03-29-define-command-prd.md
import type { PatternContext, EntityDecl } from './types'
import type { Command, VisibilityFilter } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { focusCommands } from './navigate'
import { defineCommands } from '../engine/defineCommand'

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
    if (!entity) return false // no popup entity → don't walk children
    const isOpen = (entity.isOpen as boolean) ?? false
    const triggerId = (entity.triggerId as string) ?? ''
    // Only descend into the trigger's children when popup is open
    if (nodeId === triggerId) return isOpen
    // Non-trigger containers: don't descend (popup owns the tree)
    return false
  },
}

function readPopup(ctx: PatternContext): PopupEntity {
  const entity = ctx.getEntity(POPUP_ID)
  return {
    isOpen: (entity?.isOpen as boolean) ?? false,
    triggerId: entity?.triggerId as string | undefined,
  }
}

// ② 2026-03-28-axis-handlers-export-prd.md
export const openPopup = (ctx: PatternContext): Command | void => {
  const { isOpen } = readPopup(ctx)
  const children = ctx.getChildren(ctx.focused)
  if (!isOpen && children.length > 0) {
    return createBatchCommand([
      popupCommands.open(ctx.focused),
      focusCommands.setFocus(children[0]),
    ])
  }
  return undefined
}

export const closePopup = (ctx: PatternContext): Command | void => {
  const { isOpen, triggerId } = readPopup(ctx)
  if (isOpen) {
    if (triggerId) {
      return createBatchCommand([
        popupCommands.close(),
        focusCommands.setFocus(triggerId),
      ])
    }
    return popupCommands.close()
  }
  return undefined
}

export const openAndFocusFirst = (ctx: PatternContext): Command | void => {
  const children = ctx.getChildren(ctx.focused)
  if (children.length > 0) {
    return createBatchCommand([
      popupCommands.open(ctx.focused),
      focusCommands.setFocus(children[0]),
    ])
  }
  return undefined
}

export const openAndFocusLast = (ctx: PatternContext): Command | void => {
  const children = ctx.getChildren(ctx.focused)
  if (children.length > 0) {
    return createBatchCommand([
      popupCommands.open(ctx.focused),
      focusCommands.setFocus(children[children.length - 1]),
    ])
  }
  return undefined
}

// ② 2026-03-29-ctx-axis-namespace-prd.md
export function popupCtx(
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

// ② 2026-03-29-compose-pattern-3arg-prd.md
import { activateHandler } from './activate'

export function popup(type: 'menu' | 'listbox' | 'grid' | 'tree' | 'dialog', opts?: { modal?: boolean }) {
  const config = popupConfig()

  const open_ = (ctx: PatternContext): Command | void => openPopup(ctx)
  const close_ = (ctx: PatternContext): Command | void => closePopup(ctx)
  const openOrActivate_ = (ctx: PatternContext): Command | void => openPopup(ctx) ?? activateHandler(ctx)
  const openFirstOrFocusNext_ = (ctx: PatternContext): Command | void =>
    openAndFocusFirst(ctx) ?? ctx.focusNext({ wrap: true })
  const openLastOrFocusPrev_ = (ctx: PatternContext): Command | void =>
    openAndFocusLast(ctx) ?? ctx.focusPrev({ wrap: true })

  return {
    ...config,
    __axisType: 'popup' as const,
    __popupType: type,
    __popupModal: opts?.modal,
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
      ArrowDown: (ctx: PatternContext): Command | void => openAndFocusFirst(ctx),
      ArrowUp: (ctx: PatternContext): Command | void => openAndFocusLast(ctx),
    } as Record<string, (ctx: PatternContext) => Command | void>,
  }
}

// legacy — popup() 전환 후 제거
export function popupConfig(): { keyMap: Record<string, never>; entities: EntityDecl[]; visibilityFilter: VisibilityFilter; ctxFactory: import('./types').CtxFactory } {
  return {
    keyMap: {},
    entities: [{ id: POPUP_ID, default: { isOpen: false, triggerId: '' } }],
    visibilityFilter: popupVisibilityFilter,
    ctxFactory: (engine, focusedId) => ({
      popup: popupCtx(engine, focusedId),
    }),
  }
}

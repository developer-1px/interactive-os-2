// ② 2026-03-28-popup-axis-prd.md
import type { AxisConfig, KeyMap } from './types'
import type { Command, VisibilityFilter } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { focusCommands } from './navigate'

export const POPUP_ID = '__popup__'

interface PopupEntity {
  isOpen: boolean
  triggerId: string | undefined
}

export function getPopupEntity(store: NormalizedData): PopupEntity {
  const entity = store.entities[POPUP_ID]
  return {
    isOpen: (entity?.isOpen as boolean) ?? false,
    triggerId: entity?.triggerId as string | undefined,
  }
}

export const popupCommands = {
  open(triggerId: string): Command {
    return {
      type: 'core:open',
      payload: { triggerId },
      execute(store) {
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
    }
  },

  close(): Command {
    return {
      type: 'core:close',
      execute(store) {
        const current = getPopupEntity(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [POPUP_ID]: { id: POPUP_ID, isOpen: false, triggerId: current.triggerId },
          },
        }
      },
    }
  },
}

export type PopupType = 'menu' | 'listbox' | 'grid' | 'tree' | 'dialog'

export interface PopupOptions {
  type: PopupType
  modal?: boolean
}

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

export function popup(options: PopupOptions): { keyMap: KeyMap; config: Partial<AxisConfig>; visibilityFilter: VisibilityFilter } {
  const { type, modal } = options

  function readPopup(ctx: Parameters<KeyMap[string]>[0]): PopupEntity {
    const entity = ctx.getEntity(POPUP_ID)
    return {
      isOpen: (entity?.isOpen as boolean) ?? false,
      triggerId: entity?.triggerId as string | undefined,
    }
  }

  const keyMap: KeyMap = {
    Enter(ctx) {
      const { isOpen } = readPopup(ctx)
      const children = ctx.getChildren(ctx.focused)
      if (!isOpen && children.length > 0) {
        return createBatchCommand([
          popupCommands.open(ctx.focused),
          focusCommands.setFocus(children[0]),
        ])
      }
      return undefined
    },

    Space(ctx) {
      const { isOpen } = readPopup(ctx)
      const children = ctx.getChildren(ctx.focused)
      if (!isOpen && children.length > 0) {
        return createBatchCommand([
          popupCommands.open(ctx.focused),
          focusCommands.setFocus(children[0]),
        ])
      }
      return undefined
    },

    Escape(ctx) {
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
    },

    ...(type === 'menu' && {
      ArrowDown(ctx) {
        const children = ctx.getChildren(ctx.focused)
        if (children.length > 0) {
          return createBatchCommand([
            popupCommands.open(ctx.focused),
            focusCommands.setFocus(children[0]),
          ])
        }
        return undefined
      },

      ArrowUp(ctx) {
        const children = ctx.getChildren(ctx.focused)
        if (children.length > 0) {
          return createBatchCommand([
            popupCommands.open(ctx.focused),
            focusCommands.setFocus(children[children.length - 1]),
          ])
        }
        return undefined
      },
    }),
  }

  const config = {
    popupType: type,
    ...(modal && { popupModal: true }),
  } as Partial<AxisConfig>

  return { keyMap, config, visibilityFilter: popupVisibilityFilter }
}

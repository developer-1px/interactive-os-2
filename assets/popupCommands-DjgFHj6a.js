var e=`import type { NormalizedData } from '../store/types'
import { defineCommands } from '../engine/defineCommand'

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
`;export{e as default};
var e=`import type { NormalizedData } from '../store/types'
import { defineCommands } from '../engine/defineCommand'

export const CHECKED_ID = '__checked__'

function getCheckedIds(store: NormalizedData): string[] {
  return (store.entities[CHECKED_ID]?.checkedIds as string[]) ?? []
}

export const checkedCommands = defineCommands({
  check: {
    type: 'core:check' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getCheckedIds(store)
      if (current.includes(nodeId)) return store
      return {
        ...store,
        entities: {
          ...store.entities,
          [CHECKED_ID]: { id: CHECKED_ID, checkedIds: [...current, nodeId] },
        },
      }
    },
  },

  uncheck: {
    type: 'core:uncheck' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getCheckedIds(store)
      return {
        ...store,
        entities: {
          ...store.entities,
          [CHECKED_ID]: { id: CHECKED_ID, checkedIds: current.filter((id) => id !== nodeId) },
        },
      }
    },
  },

  toggleCheck: {
    type: 'core:toggle-check' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getCheckedIds(store)
      const checkedIds = current.includes(nodeId)
        ? current.filter((id) => id !== nodeId)
        : [...current, nodeId]
      return {
        ...store,
        entities: {
          ...store.entities,
          [CHECKED_ID]: { id: CHECKED_ID, checkedIds },
        },
      }
    },
  },
})
`;export{e as default};
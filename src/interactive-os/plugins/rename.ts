import { getEntity, updateEntityData } from '../store/createStore'
import { definePlugin } from './definePlugin'
import { defineCommands } from '../engine/defineCommand'

export const RENAME_ID = '__rename__'

export const renameCommands = defineCommands({
  startRename: {
    type: 'rename:start' as const,
    create: (nodeId: string, options?: { replace?: boolean; initialChar?: string }) => ({ nodeId, options }),
    handler: (store, { nodeId, options }) => ({
      ...store,
      entities: {
        ...store.entities,
        [RENAME_ID]: {
          id: RENAME_ID,
          nodeId,
          active: true,
          ...(options?.replace !== undefined && { replace: options.replace }),
          ...(options?.initialChar !== undefined && { initialChar: options.initialChar }),
        },
      },
    }),
  },

  confirmRename: {
    type: 'rename:confirm' as const,
    create: (nodeId: string, field: string, newValue: unknown) => {
      const dotIdx = field.indexOf('.')
      const isArrayPath = dotIdx > 0
      const arrayField = isArrayPath ? field.slice(0, dotIdx) : field
      const arrayIndex = isArrayPath ? parseInt(field.slice(dotIdx + 1), 10) : -1
      return { nodeId, field, newValue, isArrayPath, arrayField, arrayIndex }
    },
    handler: (store, { nodeId, isArrayPath, arrayField, arrayIndex, field, newValue }) => {
      const entity = getEntity(store, nodeId)
      let updateData: Record<string, unknown>
      if (isArrayPath) {
        const arr = [...((entity?.data?.[arrayField] as unknown[]) ?? [])]
        arr[arrayIndex] = newValue
        updateData = { [arrayField]: arr }
      } else {
        updateData = { [field]: newValue }
      }
      let result = updateEntityData(store, nodeId, updateData)
      result = {
        ...result,
        entities: {
          ...result.entities,
          [RENAME_ID]: { id: RENAME_ID, nodeId, active: false },
        },
      }
      return result
    },
  },

  cancelRename: {
    type: 'rename:cancel' as const,
    handler: (store) => ({
      ...store,
      entities: {
        ...store.entities,
        [RENAME_ID]: {
          ...store.entities[RENAME_ID],
          id: RENAME_ID,
          active: false,
        },
      },
    }),
  },
})

export function rename() {
  return definePlugin({
    name: 'rename',
    commands: {
      startRename: renameCommands.startRename,
      confirmRename: renameCommands.confirmRename,
      cancelRename: renameCommands.cancelRename,
    },
  })
}

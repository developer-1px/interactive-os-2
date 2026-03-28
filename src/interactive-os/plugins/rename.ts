import type { Command } from '../engine/types'
import { getEntity, updateEntityData } from '../store/createStore'
import { definePlugin } from './definePlugin'

export const RENAME_ID = '__rename__'

export const renameCommands = {
  startRename(nodeId: string, options?: { replace?: boolean; initialChar?: string }): Command {
    return {
      type: 'rename:start',
      payload: { nodeId },
      execute(store) {
        return {
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
        }
      },
    }
  },

  confirmRename(nodeId: string, field: string, newValue: unknown): Command {
    // Dot-path support: "cells.2" -> update array element at index 2
    const dotIdx = field.indexOf('.')
    const isArrayPath = dotIdx > 0
    const arrayField = isArrayPath ? field.slice(0, dotIdx) : field
    const arrayIndex = isArrayPath ? parseInt(field.slice(dotIdx + 1), 10) : -1

    return {
      type: 'rename:confirm',
      payload: { nodeId, field, newValue },
      execute(store) {
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
    }
  },

  cancelRename(): Command {
    return {
      type: 'rename:cancel',
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [RENAME_ID]: {
              ...store.entities[RENAME_ID],
              id: RENAME_ID,
              active: false,
            },
          },
        }
      },
    }
  },
}

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

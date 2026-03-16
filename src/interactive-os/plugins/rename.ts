import type { Command, Plugin } from '../core/types'
import { getEntity, updateEntity } from '../core/normalized-store'

const RENAME_ID = '__rename__'

export const renameCommands = {
  startRename(nodeId: string): Command {
    return {
      type: 'rename:start',
      payload: { nodeId },
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [RENAME_ID]: { id: RENAME_ID, nodeId, active: true },
          },
        }
      },
      undo(store) {
        const { [RENAME_ID]: _removed, ...rest } = store.entities
        void _removed
        return { ...store, entities: rest }
      },
    }
  },

  confirmRename(nodeId: string, field: string, newValue: unknown): Command {
    let previousValue: unknown

    return {
      type: 'rename:confirm',
      payload: { nodeId, field, newValue },
      execute(store) {
        const entity = getEntity(store, nodeId)
        previousValue = entity?.[field]

        let result = updateEntity(store, nodeId, { [field]: newValue })
        // Clear rename state
        result = {
          ...result,
          entities: {
            ...result.entities,
            [RENAME_ID]: { id: RENAME_ID, nodeId, active: false },
          },
        }
        return result
      },
      undo(store) {
        let result = updateEntity(store, nodeId, { [field]: previousValue })
        // Restore rename state to active
        result = {
          ...result,
          entities: {
            ...result.entities,
            [RENAME_ID]: { id: RENAME_ID, nodeId, active: true },
          },
        }
        return result
      },
    }
  },

  cancelRename(): Command {
    return {
      type: 'rename:cancel',
      payload: null,
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
      undo(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [RENAME_ID]: {
              ...store.entities[RENAME_ID],
              id: RENAME_ID,
              active: true,
            },
          },
        }
      },
    }
  },
}

export function rename(): Plugin {
  return {
    commands: {
      startRename: renameCommands.startRename,
      confirmRename: renameCommands.confirmRename,
      cancelRename: renameCommands.cancelRename,
    },
  }
}

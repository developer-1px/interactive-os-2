import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import type { Entity } from '../store/types'
import { ROOT_ID } from '../store/types'
import { addEntity, removeEntity } from '../store/createStore'
import { definePlugin } from './definePlugin'
import { focusRecovery } from './focusRecovery'
import type { IsReachable } from './focusRecovery'

export const crudCommands = {
  create(entity: Entity, parentId: string = ROOT_ID, index?: number): Command {
    return {
      type: 'crud:create',
      payload: { entity, parentId, index },
      execute(store) {
        return addEntity(store, entity, parentId, index)
      },
    }
  },

  remove(nodeId: string): Command {
    return {
      type: 'crud:delete',
      payload: { nodeId },
      execute(store) {
        return removeEntity(store, nodeId)
      },
    }
  },

  removeMultiple(nodeIds: string[]): Command {
    const commands = nodeIds.map((id) => crudCommands.remove(id))
    return createBatchCommand(commands)
  },
}

export interface CrudOptions {
  isReachable?: IsReachable
}

export function crud(options?: CrudOptions) {
  return definePlugin({
    name: 'crud',
    requires: [focusRecovery({ isReachable: options?.isReachable })],
    commands: {
      create: crudCommands.create,
      delete: crudCommands.remove,
      deleteMultiple: crudCommands.removeMultiple,
    },
  })
}

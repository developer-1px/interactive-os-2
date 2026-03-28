import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import type { Entity } from '../store/types'
import { ROOT_ID } from '../store/types'
import { addEntity, removeEntity } from '../store/createStore'
import { definePlugin } from './definePlugin'
import { focusRecovery } from './focusRecovery'
import type { IsReachable } from './focusRecovery'
import { defineCommands } from '../engine/defineCommand'

const _crudCommands = defineCommands({
  create: {
    type: 'crud:create' as const,
    create: (entity: Entity, parentId: string = ROOT_ID, index?: number) => ({ entity, parentId, index }),
    handler: (store, { entity, parentId, index }) => addEntity(store, entity, parentId, index),
  },

  remove: {
    type: 'crud:delete' as const,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => removeEntity(store, nodeId),
  },
})

export const crudCommands = {
  ..._crudCommands,
  removeMultiple: (nodeIds: string[]): Command => createBatchCommand(nodeIds.map((id) => _crudCommands.remove(id))),
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

import type { Command, Entity, NormalizedData, Plugin } from '../core/types'
import { ROOT_ID, createBatchCommand } from '../core/types'
import { addEntity, removeEntity, getEntity, getChildren, getParent } from '../core/createStore'

export const crudCommands = {
  create(entity: Entity, parentId: string = ROOT_ID, index?: number): Command {
    return {
      type: 'crud:create',
      payload: { entity, parentId, index },
      execute(store) {
        return addEntity(store, entity, parentId, index)
      },
      undo(store) {
        return removeEntity(store, entity.id)
      },
    }
  },

  remove(nodeId: string): Command {
    // Capture snapshot for undo — need to store removed entities and their relationships
    let snapshot: {
      entities: Record<string, Entity>
      relationships: Record<string, string[]>
      parentId: string
      indexInParent: number
    } | null = null

    return {
      type: 'crud:delete',
      payload: { nodeId },
      execute(store) {
        // Capture everything that will be removed
        const entitiesToRemove: Record<string, Entity> = {}
        const relsToRemove: Record<string, string[]> = {}

        const collect = (id: string) => {
          const entity = getEntity(store, id)
          if (entity) entitiesToRemove[id] = entity
          const children = getChildren(store, id)
          if (children.length > 0) relsToRemove[id] = children
          for (const childId of children) collect(childId)
        }
        collect(nodeId)

        const parentId = getParent(store, nodeId) ?? ROOT_ID
        const siblings = getChildren(store, parentId)
        const indexInParent = siblings.indexOf(nodeId)

        snapshot = {
          entities: entitiesToRemove,
          relationships: relsToRemove,
          parentId,
          indexInParent,
        }

        return removeEntity(store, nodeId)
      },
      undo(store) {
        if (!snapshot) return store

        // Restore entities
        const result: NormalizedData = {
          ...store,
          entities: { ...store.entities, ...snapshot.entities },
        }

        // Restore relationships
        const relationships = { ...result.relationships }

        // Restore internal relationships (parent->children within removed subtree)
        for (const [parentId, children] of Object.entries(snapshot.relationships)) {
          relationships[parentId] = children
        }

        // Re-insert into parent's children at original position
        const parentChildren = [...(relationships[snapshot.parentId] ?? [])]
        parentChildren.splice(snapshot.indexInParent, 0, nodeId)
        relationships[snapshot.parentId] = parentChildren

        return { ...result, relationships }
      },
    }
  },

  removeMultiple(nodeIds: string[]): Command {
    const commands = nodeIds.map((id) => crudCommands.remove(id))
    return createBatchCommand(commands)
  },
}

export function crud(): Plugin {
  return {
    commands: {
      create: crudCommands.create,
      delete: crudCommands.remove,
      deleteMultiple: crudCommands.removeMultiple,
    },
  }
}

// ② 2026-04-04-inspector-redesign-prd.md
import type { InspectResult } from '@os/engine/types'
import type { AriaActions } from '@os/primitives/ariaRegistry'
import type { NormalizedData } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'

/** Metadata stored per instance root for right panel rendering */
export interface InstanceMeta {
  inspectResult: InspectResult
  registryKey: string
}

/**
 * Convert registry map → unified NormalizedData tree.
 * Instance keys become root nodes; internal entities become children.
 * Returns { tree, metas } where metas maps instance root ID → InstanceMeta.
 */
export function registryToUnifiedTree(
  actionsMap: Map<string, AriaActions>,
): { tree: NormalizedData; metas: Map<string, InstanceMeta> } {
  const entities: NormalizedData['entities'] = {}
  const relationships: NormalizedData['relationships'] = {}
  const rootIds: string[] = []
  const metas = new Map<string, InstanceMeta>()

  for (const [registryKey, actions] of actionsMap) {
    const inspectResult = actions.inspect()
    const instanceId = `__inst__${registryKey}`

    // Instance root node
    const role = inspectResult.role || 'group'
    entities[instanceId] = {
      id: instanceId,
      data: { label: `${registryKey} [${role}]` },
    }
    rootIds.push(instanceId)
    metas.set(instanceId, { inspectResult, registryKey })

    // Internal nodes from inspect state
    const { state } = inspectResult
    const childRole = inspectResult.childRole || 'item'
    const internalRootIds = state.relationships[ROOT_ID] ?? []

    if (internalRootIds.length > 0) {
      const childIds: string[] = []

      function walkNodes(nodeIds: string[], parentKey: string) {
        const mapped: string[] = []
        for (const nodeId of nodeIds) {
          // Prefix to avoid collision between instances
          const prefixedId = `${instanceId}::${nodeId}`
          const entity = state.entities[nodeId]

          // Skip meta entities (__ prefixed)
          if (nodeId.startsWith('__')) continue

          const label =
            (entity?.data as Record<string, unknown>)?.label as string | undefined
            ?? (entity?.data as Record<string, unknown>)?.title as string | undefined
            ?? (entity?.data as Record<string, unknown>)?.name as string | undefined
            ?? nodeId

          entities[prefixedId] = {
            id: prefixedId,
            data: { label: `${label} [${childRole}]` },
          }
          mapped.push(prefixedId)

          // Recurse children
          const nodeChildren = state.relationships[nodeId] ?? []
          const nonMetaChildren = nodeChildren.filter(id => !id.startsWith('__'))
          if (nonMetaChildren.length > 0) {
            walkNodes(nonMetaChildren, prefixedId)
          }
        }

        if (parentKey === instanceId) {
          childIds.push(...mapped)
        } else {
          relationships[parentKey] = mapped
        }
      }

      walkNodes(internalRootIds, instanceId)
      relationships[instanceId] = childIds
    }
  }

  relationships[ROOT_ID] = rootIds
  return { tree: { entities, relationships }, metas }
}

/**
 * Find which instance a selected tree node belongs to.
 * Returns the instance root ID (e.g., "__inst__myTree").
 */
export function findInstanceId(selectedId: string): string {
  // Instance root nodes are prefixed with __inst__
  if (selectedId.startsWith('__inst__') && !selectedId.includes('::')) {
    return selectedId
  }
  // Internal nodes are __inst__key::nodeId
  const sep = selectedId.indexOf('::')
  if (sep !== -1) {
    return selectedId.slice(0, sep)
  }
  return selectedId
}

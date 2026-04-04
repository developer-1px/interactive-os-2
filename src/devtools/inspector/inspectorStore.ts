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
 * Convert registry map → DOM-hierarchy NormalizedData tree.
 * Uses element.contains() to build parent-child nesting between instances.
 * Label: "registryKey [role] plugin1·plugin2"
 */
export function registryToUnifiedTree(
  actionsMap: Map<string, AriaActions>,
): { tree: NormalizedData; metas: Map<string, InstanceMeta> } {
  const entities: NormalizedData['entities'] = {}
  const relationships: NormalizedData['relationships'] = {}
  const metas = new Map<string, InstanceMeta>()

  // Collect instance info with DOM elements
  const instances: { id: string; registryKey: string; inspectResult: InspectResult; element: HTMLElement | null }[] = []
  for (const [registryKey, actions] of actionsMap) {
    const inspectResult = actions.inspect()
    const instanceId = `__inst__${registryKey}`
    instances.push({ id: instanceId, registryKey, inspectResult, element: actions.getElement() })

    const role = inspectResult.role || 'group'
    const plugins = inspectResult.plugins.filter(p => p !== 'anonymous')
    const pluginLabel = plugins.length > 0 ? ` ${plugins.join('·')}` : ''
    entities[instanceId] = {
      id: instanceId,
      data: { label: `${registryKey} [${role}]${pluginLabel}` },
    }
    metas.set(instanceId, { inspectResult, registryKey })
  }

  // Build DOM hierarchy using contains()
  // Sort by DOM depth (deepest first) so children are assigned before parents
  const withElement = instances.filter(i => i.element !== null)

  // For each instance, find its closest parent instance in DOM
  const childrenMap = new Map<string, string[]>()
  const assigned = new Set<string>()

  for (const child of withElement) {
    let closestParent: typeof instances[0] | null = null
    let closestDepth = Infinity

    for (const candidate of withElement) {
      if (candidate.id === child.id) continue
      if (!candidate.element!.contains(child.element!)) continue
      // Measure depth by counting ancestors between child and candidate
      let depth = 0
      let el: HTMLElement | null = child.element!.parentElement
      while (el && el !== candidate.element) {
        depth++
        el = el.parentElement
      }
      if (el === candidate.element && depth < closestDepth) {
        closestDepth = depth
        closestParent = candidate
      }
    }

    if (closestParent) {
      const list = childrenMap.get(closestParent.id) ?? []
      list.push(child.id)
      childrenMap.set(closestParent.id, list)
      assigned.add(child.id)
    }
  }

  // Internal nodes from each instance's store
  for (const inst of instances) {
    const { state } = inst.inspectResult
    const childRole = inst.inspectResult.childRole || 'item'
    const internalRootIds = state.relationships[ROOT_ID] ?? []

    if (internalRootIds.length > 0) {
      const instanceChildren: string[] = []

      function walkNodes(nodeIds: string[], parentKey: string) {
        const mapped: string[] = []
        for (const nodeId of nodeIds) {
          if (nodeId.startsWith('__')) continue
          const prefixedId = `${inst.id}::${nodeId}`
          const entity = state.entities[nodeId]
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

          const nodeChildren = state.relationships[nodeId] ?? []
          const nonMetaChildren = nodeChildren.filter(id => !id.startsWith('__'))
          if (nonMetaChildren.length > 0) {
            walkNodes(nonMetaChildren, prefixedId)
          }
        }

        if (parentKey === inst.id) {
          instanceChildren.push(...mapped)
        } else {
          relationships[parentKey] = mapped
        }
      }

      walkNodes(internalRootIds, inst.id)

      // Merge with DOM-hierarchy children (child instances)
      const domChildren = childrenMap.get(inst.id) ?? []
      relationships[inst.id] = [...instanceChildren, ...domChildren]
      childrenMap.delete(inst.id) // consumed
    }
  }

  // Root instances = not assigned as child of any other instance
  const rootIds = instances.filter(i => !assigned.has(i.id)).map(i => i.id)

  // Write remaining DOM-hierarchy relationships (instances without internal nodes)
  for (const [parentId, childIds] of childrenMap) {
    relationships[parentId] = [...(relationships[parentId] ?? []), ...childIds]
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

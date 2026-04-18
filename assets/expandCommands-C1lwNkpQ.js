var e=`import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import { defineCommands } from '../engine/defineCommand'

export const EXPANDED_ID = '__expanded__'

function getExpandedIds(store: NormalizedData): string[] {
  return (store.entities[EXPANDED_ID]?.expandedIds as string[]) ?? []
}

export const expandCommands = defineCommands({
  expand: {
    type: 'core:expand' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getExpandedIds(store)
      if (current.includes(nodeId)) return store
      return {
        ...store,
        entities: {
          ...store.entities,
          [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: [...current, nodeId] },
        },
      }
    },
  },

  collapse: {
    type: 'core:collapse' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getExpandedIds(store)
      return {
        ...store,
        entities: {
          ...store.entities,
          [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: current.filter((id) => id !== nodeId) },
        },
      }
    },
  },

  toggleExpand: {
    type: 'core:toggle-expand' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getExpandedIds(store)
      const expandedIds = current.includes(nodeId)
        ? current.filter((id) => id !== nodeId)
        : [...current, nodeId]
      return {
        ...store,
        entities: {
          ...store.entities,
          [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds },
        },
      }
    },
  },

  expandAll: {
    type: 'core:expand-all' as const,
    meta: true,
    handler: (store) => {
      const expandedIds: string[] = []
      for (const [id, children] of Object.entries(store.relationships) as [string, string[]][]) {
        if (id !== ROOT_ID && children.length > 0) expandedIds.push(id)
      }
      return {
        ...store,
        entities: {
          ...store.entities,
          [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds },
        },
      }
    },
  },

  collapseAll: {
    type: 'core:collapse-all' as const,
    meta: true,
    handler: (store) => ({
      ...store,
      entities: {
        ...store.entities,
        [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: [] },
      },
    }),
  },

  expandDescendants: {
    type: 'core:expand-descendants' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getExpandedIds(store)
      const merged = new Set(current)
      const walk = (id: string) => {
        const children = (store.relationships[id] ?? []) as string[]
        if (children.length > 0) {
          merged.add(id)
          for (const child of children) walk(child)
        }
      }
      walk(nodeId)
      if (merged.size === current.length) return store
      return {
        ...store,
        entities: {
          ...store.entities,
          [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: [...merged] },
        },
      }
    },
  },

  expandSiblings: {
    type: 'core:expand-siblings' as const,
    meta: true,
    create: (parentId: string) => ({ parentId }),
    handler: (store, { parentId }) => {
      const siblings = (store.relationships[parentId] ?? []) as string[]
      const expandable = siblings.filter((id) => ((store.relationships[id] ?? []) as string[]).length > 0)
      if (expandable.length === 0) return store
      const current = getExpandedIds(store)
      const merged = new Set(current)
      for (const id of expandable) merged.add(id)
      if (merged.size === current.length) return store
      return {
        ...store,
        entities: {
          ...store.entities,
          [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: [...merged] },
        },
      }
    },
  },
})
`;export{e as default};
import type { AxisConfig, KeyMap, PatternContext } from './types'
import type { Command, VisibilityFilter } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { defineCommands } from '../engine/defineCommand'

// ② 2026-03-29-define-command-prd.md
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
})

// ② 2026-03-28-axis-handlers-export-prd.md
export const expandHandler = (ctx: PatternContext): Command => ctx.expand()
export const collapseHandler = (ctx: PatternContext): Command => ctx.collapse()
export const toggleExpand = (ctx: PatternContext): Command =>
  ctx.isExpanded ? ctx.collapse() : ctx.expand()
export const expandOrFocusChild = (ctx: PatternContext): Command =>
  ctx.isExpanded ? ctx.focusChild() : ctx.expand()
export const collapseOrFocusParent = (ctx: PatternContext): Command =>
  ctx.isExpanded ? ctx.collapse() : ctx.focusParent()

/** Config-only: provides expandTracking + visibilityFilter, no keyMap. Pattern declares bindings. */
export function expandConfig(): { keyMap: KeyMap; config: Partial<AxisConfig>; visibilityFilter: VisibilityFilter } {
  return { keyMap: {}, config: { expandTracking: true }, visibilityFilter: expandVisibilityFilter }
}

export const expandVisibilityFilter: VisibilityFilter = {
  shouldDescend(nodeId, store) {
    const entity = store.entities[EXPANDED_ID]
    if (!entity) return true // no expand axis → walk all
    const ids = (entity.expandedIds as string[]) ?? []
    return ids.includes(nodeId)
  },
}


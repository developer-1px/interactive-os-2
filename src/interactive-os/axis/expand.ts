import type { PatternContext, EntityDecl } from './types'
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


// ② 2026-03-29-ctx-axis-namespace-prd.md
export function expandedCtx(
  engine: import('../engine/createCommandEngine').CommandEngine,
  focusedId: string,
): import('./types').ExpandedNav {
  const store = engine.getStore()
  const expandedIds = getExpandedIds(store)
  const is = expandedIds.includes(focusedId)
  return {
    is,
    set: (value: boolean) => value ? expandCommands.expand(focusedId) : expandCommands.collapse(focusedId),
    toggle: () => expandCommands.toggleExpand(focusedId),
  }
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
export function expanded() {
  const toggle = (ctx: PatternContext): Command | void => ctx.expanded?.toggle()
  const set = (value: boolean) => (ctx: PatternContext): Command | void => ctx.expanded?.set(value)
  const expandOrFocusChild_ = (ctx: PatternContext): Command | void =>
    ctx.expanded ? (ctx.expanded.is ? ctx.focusChild() : ctx.expanded.set(true)) : undefined
  const collapseOrFocusParent_ = (ctx: PatternContext): Command | void =>
    ctx.expanded ? (ctx.expanded.is ? ctx.expanded.set(false) : ctx.focusParent()) : undefined

  return {
    keyMap: {} as Record<string, never>,
    entities: [{ id: EXPANDED_ID, default: { expandedIds: [] } }] as EntityDecl[],
    visibilityFilter: expandVisibilityFilter,
    ctxFactory: ((engine, focusedId) => ({
      expanded: expandedCtx(engine, focusedId),
    })) as import('./types').CtxFactory,
    meta: { expandable: true },
    toggle,
    set,
    expand: set(true),
    collapse: set(false),
    expandOrFocusChild: expandOrFocusChild_,
    collapseOrFocusParent: collapseOrFocusParent_,
  }
}

export const expandVisibilityFilter: VisibilityFilter = {
  shouldDescend(nodeId, store) {
    const entity = store.entities[EXPANDED_ID]
    if (!entity) return true // no expand axis → walk all
    const ids = (entity.expandedIds as string[]) ?? []
    return ids.includes(nodeId)
  },
}

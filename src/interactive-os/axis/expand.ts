import type { EntityDecl, ExpandedNav } from './types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { key } from './types'
import type { VisibilityFilter } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
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
})


// ② 2026-03-29-ctx-axis-namespace-prd.md
export function expandedCtx(
  engine: CommandEngine,
  focusedId: string,
): ExpandedNav {
  const store = engine.getStore()
  const expandedIds = getExpandedIds(store)
  const children = store.relationships[focusedId] ?? []
  const is = expandedIds.includes(focusedId)
  return {
    is,
    isExpandable: children.length > 0,
    set: (value: boolean) => value ? expandCommands.expand(focusedId) : expandCommands.collapse(focusedId),
    toggle: () => expandCommands.toggleExpand(focusedId),
  }
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
export function expanded(opts?: { allExpandable?: boolean }) {
  const toggle = key(['core:toggle-expand'], (ctx) => ctx.expanded?.toggle())
  const _expand = key(['core:expand'], (ctx) => ctx.expanded?.set(true))
  const _collapse = key(['core:collapse'], (ctx) => ctx.expanded?.set(false))
  const expandOrFocusChild_ = key(['core:expand', 'core:focus'], (ctx) => {
    if (!ctx.expanded) return undefined
    if (ctx.expanded.is) return ctx.focusChild()
    if (!ctx.expanded.isExpandable) return ctx.focusNext()
    return ctx.expanded.set(true)
  })
  const collapseOrFocusParent_ = key(['core:collapse', 'core:focus'], (ctx) =>
    ctx.expanded ? (ctx.expanded.is ? ctx.expanded.set(false) : ctx.focusParent()) : undefined)

  return {
    keyMap: {} as Record<string, never>,
    entities: [{ id: EXPANDED_ID, default: { expandedIds: [] } }] as EntityDecl[],
    visibilityFilter: expandVisibilityFilter,
    ctxFactory: ((engine, focusedId) => ({
      expanded: expandedCtx(engine, focusedId),
    })) as import('./types').CtxFactory,
    meta: opts?.allExpandable ? { expandable: true } : {},
    stateGen: ((id, store, children, meta) => {
      const expandedIds = getExpandedIds(store)
      const isExpandable = children.length > 0 || (meta.expandable as boolean) || (meta.panelVisibility === 'expanded')
      return isExpandable ? { expanded: expandedIds.includes(id) } : {}
    }) as import('./types').StateGen,
    ariaGen: ((s) => {
      const result: Record<string, string> = {}
      if (s.expanded !== undefined) result['aria-expanded'] = String(s.expanded)
      if (s.level !== undefined) result['aria-level'] = String(s.level)
      return result
    }) as import('./types').AriaGen,
    toggle,
    expand: _expand,
    collapse: _collapse,
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

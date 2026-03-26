import type { AxisConfig, KeyMap } from './types'
import type { Command, VisibilityFilter } from '../engine/types'
import type { NormalizedData } from '../store/types'

// ② 2026-03-26-core-absorption-prd.md
export const EXPANDED_ID = '__expanded__'

function getExpandedIds(store: NormalizedData): string[] {
  return (store.entities[EXPANDED_ID]?.expandedIds as string[]) ?? []
}

export const expandCommands = {
  expand(nodeId: string): Command {
    return {
      type: 'core:expand',
      payload: { nodeId },
      execute(store) {
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
      undo(store) {
        const current = getExpandedIds(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: current.filter((id) => id !== nodeId) },
          },
        }
      },
    }
  },

  collapse(nodeId: string): Command {
    return {
      type: 'core:collapse',
      payload: { nodeId },
      execute(store) {
        const current = getExpandedIds(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [EXPANDED_ID]: { id: EXPANDED_ID, expandedIds: current.filter((id) => id !== nodeId) },
          },
        }
      },
      undo(store) {
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
    }
  },

  toggleExpand(nodeId: string): Command {
    return {
      type: 'core:toggle-expand',
      payload: { nodeId },
      execute(store) {
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
      undo(store) {
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
    }
  },
}

interface ExpandOptions {
  mode?: 'arrow' | 'enter-esc'
}

export const expandVisibilityFilter: VisibilityFilter = {
  shouldDescend(nodeId, store) {
    const entity = store.entities[EXPANDED_ID]
    if (!entity) return true // no expand axis → walk all
    const ids = (entity.expandedIds as string[]) ?? []
    return ids.includes(nodeId)
  },
}

export function expand(options?: ExpandOptions): { keyMap: KeyMap; config: Partial<AxisConfig>; visibilityFilter: VisibilityFilter } {
  const mode = options?.mode ?? 'arrow'

  if (mode === 'enter-esc') {
    // ② 2026-03-26-plugin-keymap-original-prd.md
    // expand 본연 동작만 — spatial/rename은 plugin keyMap에서 original 패턴으로 override
    const keyMap: KeyMap = {
      Enter: (ctx) => ctx.activate(),
      Escape: (ctx) => (ctx.isExpanded ? ctx.collapse() : ctx.focusParent()),
    }
    return { keyMap, config: { expandTracking: true }, visibilityFilter: expandVisibilityFilter }
  }

  // mode === 'arrow' (default)
  const keyMap: KeyMap = {
    ArrowRight: (ctx) => (ctx.isExpanded ? ctx.focusChild() : ctx.expand()),
    ArrowLeft: (ctx) => (ctx.isExpanded ? ctx.collapse() : ctx.focusParent()),
  }
  return { keyMap, config: { expandTracking: true }, visibilityFilter: expandVisibilityFilter }
}

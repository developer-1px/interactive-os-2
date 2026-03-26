// ② 2026-03-25-search-plugin-prd.md
import type { Command, VisibilityFilter } from '../engine/types'
import type { Plugin } from './types'
import { definePlugin } from './definePlugin'
import type { Entity } from '../store/types'

export const SEARCH_ID = '__search__'

/** Check if entity data contains filterText (case-insensitive substring match on all string values) */
export function matchesSearchFilter(entity: Entity | undefined, filterText: string): boolean {
  if (!filterText) return true
  if (!entity?.data) return false
  const lower = filterText.toLowerCase()
  for (const value of Object.values(entity.data)) {
    if (typeof value === 'string' && value.toLowerCase().includes(lower)) return true
    // Also check arrays (e.g., cells: ['a', 'b', 'c'])
    if (Array.isArray(value)) {
      for (const item of value) {
        if (typeof item === 'string' && item.toLowerCase().includes(lower)) return true
      }
    }
  }
  return false
}

export const searchCommands = {
  activateSearch(): Command {
    return {
      type: 'search:activate',
      payload: null,
      execute(store) {
        const existing = store.entities[SEARCH_ID] as Record<string, unknown> | undefined
        return {
          ...store,
          entities: {
            ...store.entities,
            [SEARCH_ID]: { id: SEARCH_ID, filterText: existing?.filterText ?? '', active: true },
          },
        }
      },
      undo(store) { return store },
    }
  },

  setFilter(text: string): Command {
    return {
      type: 'search:setFilter',
      payload: { text },
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [SEARCH_ID]: { id: SEARCH_ID, filterText: text, active: true },
          },
        }
      },
      undo(store) { return store },
    }
  },

  clearFilter(): Command {
    return {
      type: 'search:clearFilter',
      payload: null,
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [SEARCH_ID]: { id: SEARCH_ID, filterText: '', active: false },
          },
        }
      },
      undo(store) { return store },
    }
  },
}

const searchVisibilityFilter: VisibilityFilter = {
  shouldShow(nodeId, store) {
    const searchEntity = store.entities[SEARCH_ID] as Record<string, unknown> | undefined
    const filterText = (searchEntity?.filterText as string) ?? ''
    if (!filterText) return true
    return matchesSearchFilter(store.entities[nodeId], filterText)
  },
}

export function search(): Plugin {
  return definePlugin({
    name: 'search',
    commands: {
      'search:activate': searchCommands.activateSearch,
      'search:setFilter': searchCommands.setFilter,
      'search:clearFilter': searchCommands.clearFilter,
    },
    keyMap: {
      'Mod+F': () => searchCommands.activateSearch(),
    },
    visibilityFilter: searchVisibilityFilter,
  })
}

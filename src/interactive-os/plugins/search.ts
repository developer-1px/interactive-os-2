// (2) 2026-03-25-search-plugin-prd.md
import type { Command } from '../engine/types'
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
    }
  },

  clearFilter(): Command {
    return {
      type: 'search:clearFilter',
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [SEARCH_ID]: { id: SEARCH_ID, filterText: '', active: false },
          },
        }
      },
    }
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
  })
}

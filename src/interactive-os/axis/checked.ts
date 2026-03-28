import type { AxisConfig, KeyMap } from './types'
import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { defineCommands } from '../engine/defineCommand'

// ② 2026-03-29-define-command-prd.md
export const CHECKED_ID = '__checked__'

function getCheckedIds(store: NormalizedData): string[] {
  return (store.entities[CHECKED_ID]?.checkedIds as string[]) ?? []
}

export const checkedCommands = defineCommands({
  check: {
    type: 'core:check' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getCheckedIds(store)
      if (current.includes(nodeId)) return store
      return {
        ...store,
        entities: {
          ...store.entities,
          [CHECKED_ID]: { id: CHECKED_ID, checkedIds: [...current, nodeId] },
        },
      }
    },
  },

  uncheck: {
    type: 'core:uncheck' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getCheckedIds(store)
      return {
        ...store,
        entities: {
          ...store.entities,
          [CHECKED_ID]: { id: CHECKED_ID, checkedIds: current.filter((id) => id !== nodeId) },
        },
      }
    },
  },

  toggleCheck: {
    type: 'core:toggle-check' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      const current = getCheckedIds(store)
      const checkedIds = current.includes(nodeId)
        ? current.filter((id) => id !== nodeId)
        : [...current, nodeId]
      return {
        ...store,
        entities: {
          ...store.entities,
          [CHECKED_ID]: { id: CHECKED_ID, checkedIds },
        },
      }
    },
  },
})

// ② 2026-03-28-axis-handlers-export-prd.md
export const toggleCheckHandler = (ctx: import('./types').PatternContext): Command => ctx.toggleCheck()

export function checked(): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const keyMap: KeyMap = {
    Enter: toggleCheckHandler,
    Space: toggleCheckHandler,
  }
  return { keyMap, config: { checkedTracking: true, checkOnClick: true } }
}

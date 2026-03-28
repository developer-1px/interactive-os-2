import type { AxisConfig, KeyMap } from './types'
import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'

export const CHECKED_ID = '__checked__'

function getCheckedIds(store: NormalizedData): string[] {
  return (store.entities[CHECKED_ID]?.checkedIds as string[]) ?? []
}

export const checkedCommands = {
  check(nodeId: string): Command {
    return {
      type: 'core:check',
      payload: { nodeId },
      execute(store) {
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
      undo(store) {
        const current = getCheckedIds(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [CHECKED_ID]: { id: CHECKED_ID, checkedIds: current.filter((id) => id !== nodeId) },
          },
        }
      },
    }
  },

  uncheck(nodeId: string): Command {
    return {
      type: 'core:uncheck',
      payload: { nodeId },
      execute(store) {
        const current = getCheckedIds(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [CHECKED_ID]: { id: CHECKED_ID, checkedIds: current.filter((id) => id !== nodeId) },
          },
        }
      },
      undo(store) {
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
    }
  },

  toggleCheck(nodeId: string): Command {
    return {
      type: 'core:toggle-check',
      payload: { nodeId },
      execute(store) {
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
      undo(store) {
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
    }
  },
}

export function checked(): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const keyMap: KeyMap = {
    Enter: (ctx) => ctx.toggleCheck(),
    Space: (ctx) => ctx.toggleCheck(),
  }
  return { keyMap, config: { checkedTracking: true, checkOnClick: true } }
}

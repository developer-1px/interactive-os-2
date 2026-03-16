import type { Command, Plugin, NormalizedData } from '../core/types'

const FOCUS_ID = '__focus__'
const SELECTION_ID = '__selection__'
const EXPANDED_ID = '__expanded__'

export const focusCommands = {
  setFocus(nodeId: string): Command {
    let previousFocusedId: string | undefined
    return {
      type: 'core:focus',
      payload: { nodeId },
      execute(store) {
        previousFocusedId = store.entities[FOCUS_ID]?.focusedId as string | undefined
        return {
          ...store,
          entities: {
            ...store.entities,
            [FOCUS_ID]: { id: FOCUS_ID, focusedId: nodeId },
          },
        }
      },
      undo(store) {
        if (previousFocusedId === undefined) {
          const { [FOCUS_ID]: _, ...rest } = store.entities
          return { ...store, entities: rest }
        }
        return {
          ...store,
          entities: {
            ...store.entities,
            [FOCUS_ID]: { id: FOCUS_ID, focusedId: previousFocusedId },
          },
        }
      },
    }
  },
}

function getSelectedIds(store: NormalizedData): string[] {
  return (store.entities[SELECTION_ID]?.selectedIds as string[]) ?? []
}

export const selectionCommands = {
  select(nodeId: string): Command {
    let previousSelectedIds: string[] | undefined
    return {
      type: 'core:select',
      payload: { nodeId },
      execute(store) {
        previousSelectedIds = getSelectedIds(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: { id: SELECTION_ID, selectedIds: [nodeId] },
          },
        }
      },
      undo(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: { id: SELECTION_ID, selectedIds: previousSelectedIds ?? [] },
          },
        }
      },
    }
  },

  toggleSelect(nodeId: string): Command {
    return {
      type: 'core:toggle-select',
      payload: { nodeId },
      execute(store) {
        const current = getSelectedIds(store)
        const selectedIds = current.includes(nodeId)
          ? current.filter((id) => id !== nodeId)
          : [...current, nodeId]
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: { id: SELECTION_ID, selectedIds },
          },
        }
      },
      undo(store) {
        const current = getSelectedIds(store)
        const selectedIds = current.includes(nodeId)
          ? current.filter((id) => id !== nodeId)
          : [...current, nodeId]
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: { id: SELECTION_ID, selectedIds },
          },
        }
      },
    }
  },

  clearSelection(): Command {
    let previousSelectedIds: string[] | undefined
    return {
      type: 'core:clear-selection',
      payload: null,
      execute(store) {
        previousSelectedIds = getSelectedIds(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: { id: SELECTION_ID, selectedIds: [] },
          },
        }
      },
      undo(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: { id: SELECTION_ID, selectedIds: previousSelectedIds ?? [] },
          },
        }
      },
    }
  },
}

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

export function core(): Plugin {
  return {
    commands: {
      focus: focusCommands.setFocus,
      select: selectionCommands.select,
      toggleSelect: selectionCommands.toggleSelect,
      clearSelection: selectionCommands.clearSelection,
      expand: expandCommands.expand,
      collapse: expandCommands.collapse,
      toggleExpand: expandCommands.toggleExpand,
    },
  }
}

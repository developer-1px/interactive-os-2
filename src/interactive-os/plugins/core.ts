import type { Command, Plugin, NormalizedData, Middleware } from '../core/types'

export const FOCUS_ID = '__focus__'
export const SELECTION_ID = '__selection__'
export const SELECTION_ANCHOR_ID = '__selection_anchor__'
export const EXPANDED_ID = '__expanded__'
export const GRID_COL_ID = '__grid_col__'

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
          const { [FOCUS_ID]: _removed, ...rest } = store.entities
          void _removed
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
    return selectionCommands.selectRange([nodeId])
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

  setAnchor(nodeId: string): Command {
    let previousAnchor: string | undefined
    return {
      type: 'core:set-anchor',
      payload: { nodeId },
      execute(store) {
        previousAnchor = store.entities[SELECTION_ANCHOR_ID]?.anchorId as string | undefined
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ANCHOR_ID]: { id: SELECTION_ANCHOR_ID, anchorId: nodeId },
          },
        }
      },
      undo(store) {
        if (previousAnchor === undefined) {
          const { [SELECTION_ANCHOR_ID]: _removed, ...rest } = store.entities
          void _removed
          return { ...store, entities: rest }
        }
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ANCHOR_ID]: { id: SELECTION_ANCHOR_ID, anchorId: previousAnchor },
          },
        }
      },
    }
  },

  selectRange(nodeIds: string[]): Command {
    let previousSelectedIds: string[] | undefined
    return {
      type: 'core:select-range',
      payload: { nodeIds },
      execute(store) {
        previousSelectedIds = getSelectedIds(store)
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: { id: SELECTION_ID, selectedIds: nodeIds },
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

  clearAnchor(): Command {
    let previousAnchor: string | undefined
    return {
      type: 'core:clear-anchor',
      payload: null,
      execute(store) {
        previousAnchor = store.entities[SELECTION_ANCHOR_ID]?.anchorId as string | undefined
        if (!previousAnchor) return store
        const { [SELECTION_ANCHOR_ID]: _removed, ...rest } = store.entities
        void _removed
        return { ...store, entities: rest }
      },
      undo(store) {
        if (!previousAnchor) return store
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ANCHOR_ID]: { id: SELECTION_ANCHOR_ID, anchorId: previousAnchor },
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

export const gridColCommands = {
  setColIndex(colIndex: number): Command {
    let prev: number | undefined
    return {
      type: 'core:set-col-index',
      payload: { colIndex },
      execute(store) {
        prev = store.entities[GRID_COL_ID]?.colIndex as number ?? 0
        return {
          ...store,
          entities: {
            ...store.entities,
            [GRID_COL_ID]: { id: GRID_COL_ID, colIndex },
          },
        }
      },
      undo(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [GRID_COL_ID]: { id: GRID_COL_ID, colIndex: prev ?? 0 },
          },
        }
      },
    }
  },
}

/**
 * Middleware that clears the selection anchor when a standalone focus command fires.
 * This ensures Shift+Arrow starts fresh after normal navigation.
 * Batch commands (used by extendSelection) are exempt — the anchor persists within a batch.
 */
function anchorResetMiddleware(): Middleware {
  return (next) => (command) => {
    next(command)
    if (command.type === 'core:focus') {
      // Clear anchor so next Shift+Arrow recalculates from the new focus
      next(selectionCommands.clearAnchor())
    }
  }
}

export function core(): Plugin {
  return {
    middleware: anchorResetMiddleware(),
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

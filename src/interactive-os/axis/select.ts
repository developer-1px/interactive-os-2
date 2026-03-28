import type { AxisConfig, KeyMap } from './types'
import type { SelectionMode } from './types'
import type { Command, Middleware } from '../engine/types'
import type { NormalizedData } from '../store/types'

// ② 2026-03-26-core-absorption-prd.md
export const SELECTION_ID = '__selection__'
export const SELECTION_ANCHOR_ID = '__selection_anchor__'

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
    }
  },

  setAnchor(nodeId: string): Command {
    return {
      type: 'core:set-anchor',
      payload: { nodeId },
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ANCHOR_ID]: { id: SELECTION_ANCHOR_ID, anchorId: nodeId },
          },
        }
      },
    }
  },

  selectRange(nodeIds: string[]): Command {
    return {
      type: 'core:select-range',
      payload: { nodeIds },
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: { id: SELECTION_ID, selectedIds: nodeIds },
          },
        }
      },
    }
  },

  clearAnchor(): Command {
    return {
      type: 'core:clear-anchor',
      payload: null,
      execute(store) {
        const prev = store.entities[SELECTION_ANCHOR_ID]?.anchorId as string | undefined
        if (!prev) return store
        const { [SELECTION_ANCHOR_ID]: _removed, ...rest } = store.entities
        void _removed
        return { ...store, entities: rest }
      },
    }
  },

  clearSelection(): Command {
    return {
      type: 'core:clear-selection',
      payload: null,
      execute(store) {
        return {
          ...store,
          entities: {
            ...store.entities,
            [SELECTION_ID]: { id: SELECTION_ID, selectedIds: [] },
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
      next(selectionCommands.clearAnchor())
    }
  }
}

/**
 * Middleware: auto-select the focused node on standalone focus commands.
 * Batch commands (e.g. extendSelection) are exempt — they manage selection themselves.
 * APG "selection follows focus": RadioGroup, Tabs automatic.
 */
export function selectionFollowsFocusMiddleware(): Middleware {
  return (next) => (command) => {
    next(command)
    if (command.type === 'core:focus') {
      const nodeId = (command.payload as { nodeId: string }).nodeId
      next(selectionCommands.select(nodeId))
    }
  }
}

// ② 2026-03-28-axis-handlers-export-prd.md
export const toggleSelect = (ctx: import('./types').PatternContext): Command => ctx.toggleSelect()
export const extendSelectionNext = (ctx: import('./types').PatternContext): Command => ctx.extendSelection('next')
export const extendSelectionPrev = (ctx: import('./types').PatternContext): Command => ctx.extendSelection('prev')
export const extendSelectionFirst = (ctx: import('./types').PatternContext): Command => ctx.extendSelection('first')
export const extendSelectionLast = (ctx: import('./types').PatternContext): Command => ctx.extendSelection('last')
export const extendSelectionToFocused = (ctx: import('./types').PatternContext): Command => ctx.extendSelectionTo(ctx.focused)

/** Config-only: provides selectionMode + middleware, no keyMap. Pattern declares bindings. */
export function selectConfig(options?: SelectOptions): { keyMap: KeyMap; config: Partial<AxisConfig>; middleware?: Middleware } {
  const mode = options?.mode ?? 'multiple'
  const middlewares: Middleware[] = [anchorResetMiddleware()]
  if (options?.selectionFollowsFocus) {
    middlewares.push(selectionFollowsFocusMiddleware())
  }
  const middleware: Middleware = middlewares.length === 1
    ? middlewares[0]!
    : (next) => middlewares.reduceRight<(command: Command) => void>((acc, mw) => mw(acc), next)

  return {
    keyMap: {},
    config: {
      selectionMode: mode,
      ...(options?.selectionFollowsFocus && { selectionFollowsFocus: true }),
    },
    middleware,
  }
}

interface SelectOptions {
  mode?: SelectionMode  // 'single' | 'multiple', default 'multiple'
  extended?: boolean     // add Shift combos, only when mode='multiple'
  selectionFollowsFocus?: boolean
}

export function select(options?: SelectOptions): { keyMap: KeyMap; config: Partial<AxisConfig>; middleware?: Middleware } {
  const mode = options?.mode ?? 'multiple'
  const extended = options?.extended && mode === 'multiple'

  const keyMap: KeyMap = {
    Space: toggleSelect,
  }

  if (extended) {
    keyMap['Shift+ArrowDown'] = extendSelectionNext
    keyMap['Shift+ArrowUp'] = extendSelectionPrev
    keyMap['Shift+Home'] = extendSelectionFirst
    keyMap['Shift+End'] = extendSelectionLast
  }

  const middlewares: Middleware[] = [anchorResetMiddleware()]
  if (options?.selectionFollowsFocus) {
    middlewares.push(selectionFollowsFocusMiddleware())
  }

  const middleware: Middleware = middlewares.length === 1
    ? middlewares[0]!
    : (next) => {
        const chain = middlewares.reduceRight<(command: Command) => void>(
          (acc, mw) => mw(acc),
          next,
        )
        return chain
      }

  return {
    keyMap,
    config: {
      selectionMode: mode,
      selectOnClick: true,
      ...(options?.selectionFollowsFocus && { selectionFollowsFocus: true }),
    },
    middleware,
  }
}

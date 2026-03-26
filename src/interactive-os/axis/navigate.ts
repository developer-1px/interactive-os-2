import type { PatternContext } from './types'
import type { AxisConfig, KeyMap } from './types'
import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'

// ② 2026-03-26-core-absorption-prd.md
export const FOCUS_ID = '__focus__'
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

export interface NavigateOptions {
  orientation?: 'vertical' | 'horizontal' | 'both'
  wrap?: boolean
  grid?: { columns: number; tabCycle?: boolean }
}

export function navigate(options?: NavigateOptions): { keyMap: KeyMap; config: Partial<AxisConfig> } {
  const wrap = options?.wrap
  const wrapOpts = wrap ? { wrap: true as const } : undefined

  // Grid mode overrides orientation to 'both'
  if (options?.grid) {
    const columns = options.grid.columns
    const keyMap: KeyMap = {
      ArrowDown: (ctx: PatternContext) => ctx.focusNext(wrapOpts),
      ArrowUp: (ctx: PatternContext) => ctx.focusPrev(wrapOpts),
      ArrowRight: (ctx: PatternContext) => ctx.grid?.focusNextCol() ?? ctx.focusNext(wrapOpts),
      ArrowLeft: (ctx: PatternContext) => ctx.grid?.focusPrevCol() ?? ctx.focusPrev(wrapOpts),
      Home: (ctx: PatternContext) => ctx.grid?.focusFirstCol() ?? ctx.focusFirst(),
      End: (ctx: PatternContext) => ctx.grid?.focusLastCol() ?? ctx.focusLast(),
      'Mod+Home': (ctx: PatternContext) => ctx.focusFirst(),
      'Mod+End': (ctx: PatternContext) => ctx.focusLast(),
    }

    if (options.grid.tabCycle) {
      keyMap['Tab'] = (ctx: PatternContext) => {
        const g = ctx.grid
        if (!g) return
        const atLastCol = g.colIndex >= g.colCount - 1
        if (!atLastCol) return g.focusNextCol()
        // At last col: move to next row + reset to first col
        const nextRowCmd = ctx.focusNext()
        // If focusNext targets the same node, we're at the absolute last cell — stop
        if ((nextRowCmd.payload as Record<string, unknown>)?.nodeId === ctx.focused) return
        return createBatchCommand([nextRowCmd, g.focusFirstCol()])
      }
      keyMap['Shift+Tab'] = (ctx: PatternContext) => {
        const g = ctx.grid
        if (!g) return
        const atFirstCol = g.colIndex <= 0
        if (!atFirstCol) return g.focusPrevCol()
        // At first col: move to prev row + set to last col
        const prevRowCmd = ctx.focusPrev()
        // If focusPrev targets the same node, we're at the absolute first cell — stop
        if ((prevRowCmd.payload as Record<string, unknown>)?.nodeId === ctx.focused) return
        return createBatchCommand([prevRowCmd, g.focusLastCol()])
      }
    }

    return {
      keyMap,
      config: {
        focusStrategy: { type: 'roving-tabindex', orientation: 'both' },
        colCount: columns,
      },
    }
  }

  const orientation = options?.orientation ?? 'vertical'

  const keyMap: KeyMap = {}

  if (orientation === 'vertical') {
    keyMap['ArrowDown'] = (ctx: PatternContext) => ctx.focusNext(wrapOpts)
    keyMap['ArrowUp'] = (ctx: PatternContext) => ctx.focusPrev(wrapOpts)
    keyMap['Home'] = (ctx: PatternContext) => ctx.focusFirst()
    keyMap['End'] = (ctx: PatternContext) => ctx.focusLast()
  } else if (orientation === 'horizontal') {
    keyMap['ArrowRight'] = (ctx: PatternContext) => ctx.focusNext(wrapOpts)
    keyMap['ArrowLeft'] = (ctx: PatternContext) => ctx.focusPrev(wrapOpts)
    keyMap['Home'] = (ctx: PatternContext) => ctx.focusFirst()
    keyMap['End'] = (ctx: PatternContext) => ctx.focusLast()
  } else {
    // 'both' — all 4 arrows, no Home/End (matches navVhUniform v1)
    keyMap['ArrowDown'] = (ctx: PatternContext) => ctx.focusNext(wrapOpts)
    keyMap['ArrowUp'] = (ctx: PatternContext) => ctx.focusPrev(wrapOpts)
    keyMap['ArrowRight'] = (ctx: PatternContext) => ctx.focusNext(wrapOpts)
    keyMap['ArrowLeft'] = (ctx: PatternContext) => ctx.focusPrev(wrapOpts)
  }

  return {
    keyMap,
    config: {
      focusStrategy: { type: 'roving-tabindex', orientation },
    },
  }
}

import type { CtxFactory, GridNav, FocusStrategy, CellRangeCtx, CellRangeRect } from './types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { key } from './types'
import type { Command, Middleware } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import { type NormalizedData, ROOT_ID } from '../store/types'
import { getChildren, getParent } from '../store/createStore'
import {
  FOCUS_ID, focusCommands,
  GRID_COL_ID, gridColCommands,
  CELL_RANGE_ID, gridCellRangeCommands,
} from '../core'

// Re-export for backwards compatibility during migration
export { FOCUS_ID, focusCommands, GRID_COL_ID, gridColCommands, CELL_RANGE_ID, gridCellRangeCommands }

/**
 * Jump to the first/last child of the next/prev sibling group.
 * "Group" = parent of the focused node. Finds adjacent sibling of parent
 * that has children, then focuses first (direction=1) or last (direction=-1) child.
 */
function groupJump(store: NormalizedData, focusedId: string, direction: 1 | -1): Command {
  const parentId = getParent(store, focusedId)
  if (!parentId || parentId === ROOT_ID) return focusCommands.setFocus(focusedId)

  const grandparentId = getParent(store, parentId)
  if (!grandparentId) return focusCommands.setFocus(focusedId)

  const siblings = getChildren(store, grandparentId)
  const idx = siblings.indexOf(parentId)

  for (let i = idx + direction; i >= 0 && i < siblings.length; i += direction) {
    const sibId = siblings[i]!
    const children = getChildren(store, sibId)
    if (children.length > 0) {
      const target = direction === 1 ? children[0]! : children[children.length - 1]!
      return focusCommands.setFocus(target)
    }
    return focusCommands.setFocus(sibId)
  }

  return focusCommands.setFocus(focusedId)
}

interface CellRangeEntityValue {
  anchorRowId: string
  anchorCol: number
  focusRowId: string
  focusCol: number
}

function getCellRange(store: NormalizedData): CellRangeEntityValue | null {
  const ent = store.entities[CELL_RANGE_ID] as { value?: CellRangeEntityValue | null } | undefined
  return ent?.value ?? null
}

/**
 * Middleware: clear cellRange when a standalone focus command fires.
 * Batch commands (Shift+Arrow extend) are exempt — anchor persists within a batch.
 * Same pattern as select.ts:anchorResetMiddleware.
 */
function anchorCellMiddleware(): Middleware {
  return (next, _getStore) => (command) => {
    next(command)
    if (command.type === 'core:focus' || command.type === 'core:set-col-index') {
      next(gridCellRangeCommands.clearRange())
    }
  }
}

// ② 2026-03-29-ctx-axis-namespace-prd.md
export function gridCtx(
  engine: CommandEngine,
  focusedId: string,
  rowIds: string[],
  colCount: number,
  initialColIndex = 0,
): GridNav {
  const store = engine.getStore()
  const currentCol = (store.entities[GRID_COL_ID]?.colIndex as number) ?? initialColIndex
  return {
    colIndex: currentCol,
    colCount,
    focusNextCol: () => gridColCommands.setColIndex(Math.min(currentCol + 1, colCount - 1)),
    focusPrevCol: () => gridColCommands.setColIndex(Math.max(currentCol - 1, 0)),
    focusFirstCol: () => gridColCommands.setColIndex(0),
    focusLastCol: () => gridColCommands.setColIndex(colCount - 1),
    focusRow: () => gridColCommands.setColIndex(-1),
    cellRange: currentCol < 0 ? null : cellRangeCtx(engine, focusedId, currentCol, rowIds, colCount),
  }
}

function cellRangeCtx(
  engine: CommandEngine,
  focusedId: string,
  colIndex: number,
  rowIds: string[],
  colCount: number,
): CellRangeCtx {
  const store = engine.getStore()
  const range = getCellRange(store)

  let rect: CellRangeRect | null = null
  let cells: Array<{ rowId: string; col: number }> = []
  if (range) {
    const r0idx = rowIds.indexOf(range.anchorRowId)
    const r1idx = rowIds.indexOf(range.focusRowId)
    if (r0idx !== -1 && r1idx !== -1) {
      const r0 = Math.min(r0idx, r1idx)
      const r1 = Math.max(r0idx, r1idx)
      const c0 = Math.min(range.anchorCol, range.focusCol)
      const c1 = Math.max(range.anchorCol, range.focusCol)
      rect = { r0, c0, r1, c1 }
      const out: Array<{ rowId: string; col: number }> = []
      for (let r = r0; r <= r1; r++) {
        const rowId = rowIds[r]
        if (!rowId) continue
        for (let c = c0; c <= c1; c++) out.push({ rowId, col: c })
      }
      cells = out
    }
  }

  return {
    rect,
    cells,
    extendCol(dir) {
      let newCol = colIndex
      if (dir === 'next') newCol = Math.min(colIndex + 1, colCount - 1)
      else if (dir === 'prev') newCol = Math.max(colIndex - 1, 0)
      else if (dir === 'first') newCol = 0
      else if (dir === 'last') newCol = colCount - 1
      const seed: Command[] = range ? [] : [
        gridCellRangeCommands.setRange({
          anchorRowId: focusedId, anchorCol: colIndex,
          focusRowId: focusedId, focusCol: colIndex,
        }),
      ]
      return createBatchCommand([
        ...seed,
        gridColCommands.setColIndex(newCol),
        gridCellRangeCommands.extendRange({ focusRowId: focusedId, focusCol: newCol }),
      ])
    },
    extendRow(dir) {
      const idx = rowIds.indexOf(focusedId)
      let newIdx = idx
      if (dir === 'next') newIdx = Math.min(idx + 1, rowIds.length - 1)
      else if (dir === 'prev') newIdx = Math.max(idx - 1, 0)
      else if (dir === 'first') newIdx = 0
      else if (dir === 'last') newIdx = rowIds.length - 1
      const newRowId = rowIds[newIdx] ?? focusedId
      const seed: Command[] = range ? [] : [
        gridCellRangeCommands.setRange({
          anchorRowId: focusedId, anchorCol: colIndex,
          focusRowId: focusedId, focusCol: colIndex,
        }),
      ]
      return createBatchCommand([
        ...seed,
        focusCommands.setFocus(newRowId),
        gridCellRangeCommands.extendRange({ focusRowId: newRowId, focusCol: colIndex }),
      ])
    },
    extendTo(rowId, col) {
      const seed: Command[] = range ? [] : [
        gridCellRangeCommands.setRange({
          anchorRowId: focusedId, anchorCol: colIndex,
          focusRowId: focusedId, focusCol: colIndex,
        }),
      ]
      return createBatchCommand([
        ...seed,
        focusCommands.setFocus(rowId),
        gridColCommands.setColIndex(col),
        gridCellRangeCommands.extendRange({ focusRowId: rowId, focusCol: col }),
      ])
    },
    clear() {
      return gridCellRangeCommands.clearRange()
    },
  }
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
// ② 2026-03-30-spatial-navigate-prd.md
export type NavigateType = 'vertical' | 'horizontal' | 'both' | 'activedescendant' | 'natural' | 'spatial'

export interface SpatialOptions {
  selector: string | (() => string)
}

function toFocusStrategy(type: NavigateType): FocusStrategy {
  if (type === 'activedescendant') return { type: 'aria-activedescendant', orientation: 'vertical' }
  if (type === 'natural') return { type: 'natural-tab-order', orientation: 'vertical' }
  if (type === 'spatial') return { type: 'roving-tabindex', orientation: 'both' }
  return { type: 'roving-tabindex', orientation: type }
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
// Navigate ctxFactory — focus movement methods only (store infra is in createPatternContext)
function navigateCtxFactory(): CtxFactory {
  return (engine, focusedId, visibleNodes) => {
    const store = engine.getStore()
    return {
      focusNext(opts?: { wrap?: boolean }): Command {
        const visible = visibleNodes()
        const idx = visible.indexOf(focusedId)
        let nextId: string
        if (opts?.wrap) {
          nextId = visible[(idx + 1) % visible.length] ?? focusedId
        } else {
          nextId = visible[idx + 1] ?? focusedId
        }
        return focusCommands.setFocus(nextId)
      },
      focusPrev(opts?: { wrap?: boolean }): Command {
        const visible = visibleNodes()
        const idx = visible.indexOf(focusedId)
        let prevId: string
        if (opts?.wrap) {
          prevId = visible[(idx - 1 + visible.length) % visible.length] ?? focusedId
        } else {
          prevId = visible[idx - 1] ?? focusedId
        }
        return focusCommands.setFocus(prevId)
      },
      focusFirst(): Command {
        const visible = visibleNodes()
        return focusCommands.setFocus(visible[0] ?? focusedId)
      },
      focusLast(): Command {
        const visible = visibleNodes()
        return focusCommands.setFocus(visible[visible.length - 1] ?? focusedId)
      },
      focusParent(): Command {
        const parentId = getParent(store, focusedId)
        if (!parentId || parentId === ROOT_ID) return focusCommands.setFocus(focusedId)
        return focusCommands.setFocus(parentId)
      },
      focusChild(): Command {
        const children = getChildren(store, focusedId)
        if (children.length === 0) return focusCommands.setFocus(focusedId)
        return focusCommands.setFocus(children[0]!)
      },
      focusNextGroup(): Command {
        return groupJump(store, focusedId, 1)
      },
      focusPrevGroup(): Command {
        return groupJump(store, focusedId, -1)
      },
    }
  }
}

// ② 2026-03-30-spatial-navigate-prd.md
export function navigate(type: NavigateType = 'vertical', opts?: SpatialOptions) {
  const next = key(['core:focus'], (ctx) => ctx.focusNext())
  const prev = key(['core:focus'], (ctx) => ctx.focusPrev())
  const first = key(['core:focus'], (ctx) => ctx.focusFirst())
  const last = key(['core:focus'], (ctx) => ctx.focusLast())
  const parent = key(['core:focus'], (ctx) => ctx.focusParent())
  const child = key(['core:focus'], (ctx) => ctx.focusChild())
  const nextWrap = key(['core:focus'], (ctx) => ctx.focusNext({ wrap: true }))
  const prevWrap = key(['core:focus'], (ctx) => ctx.focusPrev({ wrap: true }))
  const nextGroup = key(['core:focus'], (ctx) => ctx.focusNextGroup())
  const prevGroup = key(['core:focus'], (ctx) => ctx.focusPrevGroup())

  // Spatial directional handlers — delegate to ctx.spatialMove (provided by useSpatialBridge)
  const up = key(['core:focus'], (ctx) => ctx.spatialMove?.('ArrowUp'))
  const down = key(['core:focus'], (ctx) => ctx.spatialMove?.('ArrowDown'))
  const left = key(['core:focus'], (ctx) => ctx.spatialMove?.('ArrowLeft'))
  const right = key(['core:focus'], (ctx) => ctx.spatialMove?.('ArrowRight'))

  const isSpatial = type === 'spatial'
  const meta: Record<string, unknown> = isSpatial
    ? { focusStrategy: { type: 'roving-tabindex' as const, orientation: 'both' as const }, spatialSelector: opts?.selector }
    : { focusStrategy: toFocusStrategy(type) }

  return {
    keyMap: {} as Record<string, never>,
    ctxFactory: navigateCtxFactory(),
    meta,
    // 1D handlers
    next,
    prev,
    first,
    last,
    parent,
    child,
    nextWrap,
    prevWrap,
    nextGroup,
    prevGroup,
    // spatial 2D handlers
    up,
    down,
    left,
    right,
  }
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
export function grid(columns: number, opts?: { initialColIndex?: number }) {
  const initialCol = opts?.initialColIndex ?? 0

  const focusNextCol_ = key(['core:set-col-index'], (ctx) => ctx.grid?.focusNextCol())
  const focusPrevCol_ = key(['core:set-col-index'], (ctx) => ctx.grid?.focusPrevCol())
  const focusFirstCol_ = key(['core:set-col-index'], (ctx) => ctx.grid?.focusFirstCol())
  const focusLastCol_ = key(['core:set-col-index'], (ctx) => ctx.grid?.focusLastCol())
  const tabCycleNext_ = key(['core:set-col-index', 'core:focus'], (ctx) => {
    const g = ctx.grid
    if (!g) return
    const atLastCol = g.colIndex >= g.colCount - 1
    if (!atLastCol) return g.focusNextCol()
    const nextRowCmd = ctx.focusNext()
    if ((nextRowCmd.payload as Record<string, unknown>)?.nodeId === ctx.focused) return
    return createBatchCommand([nextRowCmd, g.focusFirstCol()])
  })
  const tabCyclePrev_ = key(['core:set-col-index', 'core:focus'], (ctx) => {
    const g = ctx.grid
    if (!g) return
    const atFirstCol = g.colIndex <= 0
    if (!atFirstCol) return g.focusPrevCol()
    const prevRowCmd = ctx.focusPrev()
    if ((prevRowCmd.payload as Record<string, unknown>)?.nodeId === ctx.focused) return
    return createBatchCommand([prevRowCmd, g.focusLastCol()])
  })
  const focusRow_ = key(['core:set-col-index'], (ctx) => ctx.grid?.focusRow())

  return {
    keyMap: {} as Record<string, never>,
    entities: [
      { id: GRID_COL_ID, default: { colIndex: initialCol } },
      { id: CELL_RANGE_ID, default: { value: null } },
    ] as import('./types').EntityDecl[],
    middleware: anchorCellMiddleware(),
    meta: { colCount: columns },
    ariaGen: ((s) => ({ 'aria-rowindex': String((s.index as number ?? 0) + 1) })) as import('./types').AriaGen,
    ctxFactory: ((engine, focusedId, visibleNodes) => ({
      grid: gridCtx(engine, focusedId, visibleNodes(), columns, initialCol),
    })) as CtxFactory,
    // handlers
    focusNextCol: focusNextCol_,
    focusPrevCol: focusPrevCol_,
    focusFirstCol: focusFirstCol_,
    focusLastCol: focusLastCol_,
    tabCycleNext: tabCycleNext_,
    tabCyclePrev: tabCyclePrev_,
    focusRow: focusRow_,
  }
}

import type { PatternContext, CtxFactory } from './types'
import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import { defineCommands } from '../engine/defineCommand'
import { ROOT_ID } from '../store/types'
import { getEntity, getChildren, getParent } from '../store/createStore'

// ② 2026-03-29-define-command-prd.md
export const FOCUS_ID = '__focus__'
export const GRID_COL_ID = '__grid_col__'

export const focusCommands = defineCommands({
  setFocus: {
    type: 'core:focus' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => ({
      ...store,
      entities: {
        ...store.entities,
        [FOCUS_ID]: { id: FOCUS_ID, focusedId: nodeId },
      },
    }),
  },
})

export const gridColCommands = defineCommands({
  setColIndex: {
    type: 'core:set-col-index' as const,
    meta: true,
    create: (colIndex: number) => ({ colIndex }),
    handler: (store, { colIndex }) => ({
      ...store,
      entities: {
        ...store.entities,
        [GRID_COL_ID]: { id: GRID_COL_ID, colIndex },
      },
    }),
  },
})

// ② 2026-03-29-ctx-axis-namespace-prd.md
export function gridCtx(
  engine: import('../engine/createCommandEngine').CommandEngine,
  _focusedId: string,
  colCount: number,
): import('./types').GridNav {
  const store = engine.getStore()
  const currentCol = (store.entities[GRID_COL_ID]?.colIndex as number) ?? 0
  return {
    colIndex: currentCol,
    colCount,
    focusNextCol: () => gridColCommands.setColIndex(Math.min(currentCol + 1, colCount - 1)),
    focusPrevCol: () => gridColCommands.setColIndex(Math.max(currentCol - 1, 0)),
    focusFirstCol: () => gridColCommands.setColIndex(0),
    focusLastCol: () => gridColCommands.setColIndex(colCount - 1),
    focusRow: () => gridColCommands.setColIndex(-1),
  }
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
export type NavigateType = 'vertical' | 'horizontal' | 'both' | 'activedescendant' | 'natural'

// ② 2026-03-29-compose-pattern-3arg-prd.md
function navigateCtxFactory(): CtxFactory {
  return (engine, focusedId, visibleNodes) => {
    const store = engine.getStore()
    return {
      focused: focusedId,
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
      dispatch(command: Command): void {
        engine.dispatch(command)
      },
      getEntity(id: string) {
        return getEntity(store, id)
      },
      getChildren(id: string) {
        return getChildren(store, id)
      },
      getParent(id: string) {
        return getParent(store, id)
      },
    }
  }
}

export function navigate(type: NavigateType = 'vertical') {
  const next = (ctx: PatternContext): Command => ctx.focusNext()
  const prev = (ctx: PatternContext): Command => ctx.focusPrev()
  const first = (ctx: PatternContext): Command => ctx.focusFirst()
  const last = (ctx: PatternContext): Command => ctx.focusLast()
  const parent = (ctx: PatternContext): Command => ctx.focusParent()
  const child = (ctx: PatternContext): Command => ctx.focusChild()
  const nextWrap = (ctx: PatternContext): Command => ctx.focusNext({ wrap: true })
  const prevWrap = (ctx: PatternContext): Command => ctx.focusPrev({ wrap: true })

  return {
    keyMap: {} as Record<string, never>,
    ctxFactory: navigateCtxFactory(),
    __axisType: 'navigate' as const,
    __navType: type,
    // handlers
    next,
    prev,
    first,
    last,
    parent,
    child,
    nextWrap,
    prevWrap,
  }
}

// ② 2026-03-29-compose-pattern-3arg-prd.md
export function grid(columns: number) {
  const focusNextCol_ = (ctx: PatternContext): Command | void => ctx.grid?.focusNextCol()
  const focusPrevCol_ = (ctx: PatternContext): Command | void => ctx.grid?.focusPrevCol()
  const focusFirstCol_ = (ctx: PatternContext): Command | void => ctx.grid?.focusFirstCol()
  const focusLastCol_ = (ctx: PatternContext): Command | void => ctx.grid?.focusLastCol()
  const tabCycleNext_ = (ctx: PatternContext): Command | void => {
    const g = ctx.grid
    if (!g) return
    const atLastCol = g.colIndex >= g.colCount - 1
    if (!atLastCol) return g.focusNextCol()
    const nextRowCmd = ctx.focusNext()
    if ((nextRowCmd.payload as Record<string, unknown>)?.nodeId === ctx.focused) return
    return createBatchCommand([nextRowCmd, g.focusFirstCol()])
  }
  const tabCyclePrev_ = (ctx: PatternContext): Command | void => {
    const g = ctx.grid
    if (!g) return
    const atFirstCol = g.colIndex <= 0
    if (!atFirstCol) return g.focusPrevCol()
    const prevRowCmd = ctx.focusPrev()
    if ((prevRowCmd.payload as Record<string, unknown>)?.nodeId === ctx.focused) return
    return createBatchCommand([prevRowCmd, g.focusLastCol()])
  }
  const focusRow_ = (ctx: PatternContext): Command | void => ctx.grid?.focusRow()

  return {
    keyMap: {} as Record<string, never>,
    __axisType: 'grid' as const,
    columns,
    ctxFactory: ((engine, focusedId) => ({
      grid: gridCtx(engine, focusedId, columns),
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

// ② 2026-03-28-axis-handlers-export-prd.md (legacy — navigate() 전환 후 제거)
export const focusNext = (ctx: PatternContext): Command => ctx.focusNext()
export const focusPrev = (ctx: PatternContext): Command => ctx.focusPrev()
export const focusFirst = (ctx: PatternContext): Command => ctx.focusFirst()
export const focusLast = (ctx: PatternContext): Command => ctx.focusLast()
export const focusParent = (ctx: PatternContext): Command => ctx.focusParent()
export const focusChild = (ctx: PatternContext): Command => ctx.focusChild()
export const focusNextCol = (ctx: PatternContext): Command | void => ctx.grid?.focusNextCol()
export const focusPrevCol = (ctx: PatternContext): Command | void => ctx.grid?.focusPrevCol()
export const focusFirstCol = (ctx: PatternContext): Command | void => ctx.grid?.focusFirstCol()
export const focusLastCol = (ctx: PatternContext): Command | void => ctx.grid?.focusLastCol()
export const focusNextWrap = (ctx: PatternContext): Command => ctx.focusNext({ wrap: true })
export const focusPrevWrap = (ctx: PatternContext): Command => ctx.focusPrev({ wrap: true })

export const gridTabCycleNext = (ctx: PatternContext): Command | void => {
  const g = ctx.grid
  if (!g) return
  const atLastCol = g.colIndex >= g.colCount - 1
  if (!atLastCol) return g.focusNextCol()
  const nextRowCmd = ctx.focusNext()
  if ((nextRowCmd.payload as Record<string, unknown>)?.nodeId === ctx.focused) return
  return createBatchCommand([nextRowCmd, g.focusFirstCol()])
}

export const gridTabCyclePrev = (ctx: PatternContext): Command | void => {
  const g = ctx.grid
  if (!g) return
  const atFirstCol = g.colIndex <= 0
  if (!atFirstCol) return g.focusPrevCol()
  const prevRowCmd = ctx.focusPrev()
  if ((prevRowCmd.payload as Record<string, unknown>)?.nodeId === ctx.focused) return
  return createBatchCommand([prevRowCmd, g.focusLastCol()])
}

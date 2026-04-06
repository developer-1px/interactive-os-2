import type { CtxFactory, GridNav, FocusStrategy } from './types'
import type { CommandEngine } from '../engine/createCommandEngine'
import { key } from './types'
import type { Command } from '../engine/types'
import { createBatchCommand } from '../engine/types'
import { defineCommands } from '../engine/defineCommand'
import { type NormalizedData, ROOT_ID } from '../store/types'
import { getChildren, getParent } from '../store/createStore'

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

// ② 2026-03-29-define-command-prd.md
export const FOCUS_ID = '__focus__'
export const GRID_COL_ID = '__grid_col__'

export const focusCommands = defineCommands({
  setFocus: {
    type: 'core:focus' as const,
    meta: true,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) => {
      if ((store.entities[FOCUS_ID] as { focusedId?: string } | undefined)?.focusedId === nodeId) return store
      return {
        ...store,
        entities: {
          ...store.entities,
          [FOCUS_ID]: { id: FOCUS_ID, focusedId: nodeId },
        },
      }
    },
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
  engine: CommandEngine,
  _focusedId: string,
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
    entities: [{ id: GRID_COL_ID, default: { colIndex: initialCol } }] as import('./types').EntityDecl[],
    meta: { colCount: columns },
    ariaGen: ((s) => ({ 'aria-rowindex': String((s.index as number ?? 0) + 1) })) as import('./types').AriaGen,
    ctxFactory: ((engine, focusedId) => ({
      grid: gridCtx(engine, focusedId, columns, initialCol),
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


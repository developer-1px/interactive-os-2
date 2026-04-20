// ② 2026-04-13-grid-cell-range-prd.md
import { useEffect } from 'react'
import { definePlugin } from './definePlugin'
import type { Command, Middleware } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { createBatchCommand } from '../engine/types'
import {
  CELL_RANGE_ID,
  GRID_COL_ID,
  focusCommands,
  gridCellRangeCommands,
  gridColCommands,
} from '../core'

/**
 * Pointer-driven cell range drag selection plugin.
 *
 * Attaches a pointerdown listener on the useAria container (the grid) and
 * promotes drags into `cellRange` extensions. Keyboard interactions remain
 * handled by the grid pattern keyMap; this plugin is pointer-only and never
 * registers any key bindings. dnd plugin is keyboard-only and operates on
 * row drag handles, so the two never compete for the same DOM target.
 *
 * Behaviour (PRD ③):
 *   pointerdown(cell)  → setFocus(rowId) + setColIndex(col) + clearRange()
 *                        (anchorCellMiddleware turns this into a fresh anchor)
 *   pointermove(cell)  → batch[setFocus, setColIndex, extendRange]
 *                        (batched so anchorCellMiddleware does NOT clear)
 *   pointerup / cancel → drag flag down, cellRange persists
 *
 * Dispatch path: middleware factory captures `next` (the downstream chain) at
 * composition time. Pointer handlers call this captured `next` to dispatch.
 * All commands involved are `meta: true`, so bypassing the upstream history
 * middleware has no semantic effect.
 */
export function cellDragSelect() {
  let dispatch: ((command: Command) => void) | null = null
  let getStore: (() => NormalizedData) | null = null

  // Drag transient state — pure module-local closure (PRD: drag is transient).
  let dragging = false
  let lastRowId: string | null = null
  let lastCol = -1

  const cellSelector = '[role="gridcell"]'
  // Conventional row drag handle marker — early-return if pointerdown lands here.
  const dragHandleSelector = '[data-drag-handle]'

  function findCell(target: EventTarget | null): HTMLElement | null {
    if (!(target instanceof Element)) return null
    // Row drag handle has priority — let dnd / row-level reorder own that area.
    if (target.closest(dragHandleSelector)) return null
    const cell = target.closest<HTMLElement>(cellSelector)
    return cell
  }

  function readCellCoords(cell: HTMLElement): { rowId: string; col: number } | null {
    const colIndexAttr = cell.getAttribute('aria-colindex')
    if (!colIndexAttr) return null
    const col = Number(colIndexAttr) - 1 // aria-colindex is 1-based
    if (!Number.isFinite(col) || col < 0) return null
    // Row id lives on the closest ancestor with [data-node-id] (Aria.Item row).
    const rowEl = cell.closest<HTMLElement>('[data-node-id]')
    const rowId = rowEl?.getAttribute('data-node-id')
    if (!rowId) return null
    return { rowId, col }
  }

  /** Hit-test the cell under the cursor — drag continues across cell boundaries. */
  function cellAtPoint(clientX: number, clientY: number): { rowId: string; col: number } | null {
    const el = document.elementFromPoint(clientX, clientY)
    if (!el) return null
    const cell = el.closest<HTMLElement>(cellSelector)
    if (!cell) return null
    return readCellCoords(cell)
  }

  function endDrag() {
    dragging = false
    lastRowId = null
    lastCol = -1
  }

  const middleware: Middleware = (next, gs) => {
    dispatch = next
    getStore = gs
    return (command) => next(command)
  }

  return definePlugin({
    name: 'cellDragSelect',
    middleware,
    useEffect: (ctx) => {
       
      useEffect(() => {
        const container = ctx.containerRef.current
        if (!container) return

        const onPointerDown = (e: PointerEvent) => {
          // Only primary button initiates drag selection.
          if (e.button !== 0) return
          const cell = findCell(e.target)
          if (!cell) return
          const coords = readCellCoords(cell)
          if (!coords) return

          // Refuse to engage when the grid is in row-mode (colIdx < 0) — cellRange
          // is undefined there. Read GRID_COL via getStore to stay decoupled.
          const store = getStore?.()
          const currentCol = (store?.entities[GRID_COL_ID]?.colIndex as number | undefined) ?? 0
          if (currentCol < 0) return
          // If cellRange entity is missing entirely, the grid axis isn't installed
          // for this useAria instance — bail without dispatching.
          if (!store?.entities[CELL_RANGE_ID]) return

          dragging = true
          lastRowId = coords.rowId
          lastCol = coords.col

          // Clean state: setFocus + setColIndex first (standalone setFocus so
          // anchorCellMiddleware clears any prior range), then seed cellRange
          // anchored on the pointerdown cell so subsequent extendRange calls
          // grow from this point — extendRange creates a degenerate range when
          // cellRange is null, which would lose the anchor on the first move.
          dispatch?.(focusCommands.setFocus(coords.rowId))
          dispatch?.(gridColCommands.setColIndex(coords.col))
          dispatch?.(
            gridCellRangeCommands.setRange({
              anchorRowId: coords.rowId,
              anchorCol: coords.col,
              focusRowId: coords.rowId,
              focusCol: coords.col,
            }),
          )
        }

        const onPointerMove = (e: PointerEvent) => {
          if (!dragging) return
          // Buttons mask: bit 0 = primary. If user released outside our element,
          // honour that and end the drag (Sheets parity — last extend stays).
          if ((e.buttons & 1) === 0) {
            endDrag()
            return
          }
          const coords = cellAtPoint(e.clientX, e.clientY)
          if (!coords) return
          if (coords.rowId === lastRowId && coords.col === lastCol) return
          lastRowId = coords.rowId
          lastCol = coords.col

          // Batch so anchorCellMiddleware does NOT clear the range — it only
          // reacts to standalone core:focus commands.
          dispatch?.(
            createBatchCommand([
              focusCommands.setFocus(coords.rowId),
              gridColCommands.setColIndex(coords.col),
              gridCellRangeCommands.extendRange({
                focusRowId: coords.rowId,
                focusCol: coords.col,
              }),
            ]),
          )
        }

        const onPointerUp = () => {
          if (!dragging) return
          endDrag()
        }

        const onPointerCancel = () => {
          if (!dragging) return
          endDrag()
        }

        container.addEventListener('pointerdown', onPointerDown)
        document.addEventListener('pointermove', onPointerMove)
        document.addEventListener('pointerup', onPointerUp)
        document.addEventListener('pointercancel', onPointerCancel)

        return () => {
          container.removeEventListener('pointerdown', onPointerDown)
          document.removeEventListener('pointermove', onPointerMove)
          document.removeEventListener('pointerup', onPointerUp)
          document.removeEventListener('pointercancel', onPointerCancel)
          endDrag()
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps -- containerRef stable
      }, [])
    },
  })
}

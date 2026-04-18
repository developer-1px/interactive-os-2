var e=`// ② engine-validator-clipboard-prd.md
import type { NormalizedData } from '../store/types'
import type { Command } from '../engine/types'
import { ROOT_ID } from '../store/types'
import {
  createStore,
  getEntity,
  getChildren,
  getParent,
  updateEntityData,
  extractSubtree,
  mergeSubtree,
  removeEntity,
  resetMergeIdCounter,
} from '../store/createStore'
import { definePlugin } from './definePlugin'
import { key } from '../axis/types'
import { defineCommands } from '../engine/defineCommand'

/** Schema-based paste routing result:
 *  - 'insert': add as new child (collection)
 *  - 'overwrite': replace editable fields of existing node (slot)
 *  - false: reject paste
 *  - boolean backward compat: true -> 'insert', false -> false */
export type CanAcceptResult = 'insert' | 'overwrite' | boolean

/** Schema-based paste routing: can parentData accept childData as a child? */
export type CanAcceptFn = (
  parentData: Record<string, unknown> | undefined,
  childData: Record<string, unknown> | undefined,
) => CanAcceptResult

/** Can children of this parent be deleted/cut?
 *  Returns false for slot parents (fixed structure). */
export type CanDeleteFn = (
  parentData: Record<string, unknown> | undefined,
) => boolean

// -- Command TYPE constants --

export const COPY = 'clipboard:copy' as const
export const CUT = 'clipboard:cut' as const
export const PASTE = 'clipboard:paste' as const
export const COPY_CELL = 'clipboard:copyCellValue' as const
export const PASTE_CELL = 'clipboard:pasteCellValue' as const
export const CLEAR_CELL = 'clipboard:clearCellValue' as const
export const CUT_CELL = 'clipboard:cutCellValue' as const
export const COPY_CELL_RANGE = 'clipboard:copyCellRange' as const
export const PASTE_CELL_RANGE = 'clipboard:pasteCellRange' as const
export const CLEAR_CELL_RANGE = 'clipboard:clearCellRange' as const

/** Resolve target node IDs: selected ids if any, otherwise focused as single-element array. */
function resolveTargetIds(ctx: { focused: string; selected?: { ids: string[] } }): string[] {
  return (ctx.selected?.ids.length ?? 0) > 0 ? ctx.selected!.ids : [ctx.focused]
}

// ② grid-cell-range-prd.md — cellRange targets are 2D cells, distinct from row-level targets.
// Returns null when no cellRange is active so callers can fall back to row-level resolveTargetIds.
type CellTarget = { rowId: string; col: number }
function resolveCellTargets(
  ctx: { grid?: { cellRange?: { cells: CellTarget[] } | null } | null },
): CellTarget[] | null {
  const cells = ctx.grid?.cellRange?.cells
  if (!cells || cells.length === 0) return null
  return cells
}

// -- Serialize/Deserialize types --

// ② 2026-04-04-clipboard-serialize-prd.md
export type ClipboardSerializeFn = (subtree: NormalizedData, fullStore: NormalizedData) => string
export type ClipboardDeserializeFn = (text: string) => NormalizedData | null

// -- Module-level clipboard data (shared -- OS clipboard model) --

// ② engine-validator-clipboard-prd.md — buffer is now NormalizedData
let clipboardBuffer: NormalizedData = createStore()
let clipboardMode: 'copy' | 'cut' = 'copy'
let cutSourceIds: string[] = []
let cellValueBuffer: string = ''
// ② grid-cell-range-prd.md — 2D cell range buffer (rows × cols of strings)
let cellRangeBuffer: string[][] = []
let serializedText: string | null = null
let boundSerializeFn: ClipboardSerializeFn | undefined
let boundDeserializeFn: ClipboardDeserializeFn | undefined

/** Read-only access to cut source IDs -- for UI cut-state styling */
export function getCutSourceIds(): readonly string[] {
  return cutSourceIds
}

// ② 2026-04-04-clipboard-serialize-prd.md
/** Read serialized text after copy/cut — for useAriaView to write to clipboardData */
export function getSerializedText(): string | null {
  return serializedText
}

// ② 2026-04-04-clipboard-serialize-prd.md
/** Inject external clipboard text into buffer via deserialize. Returns true if successful. */
export function setExternalClipboard(text: string): boolean {
  if (!text || !boundDeserializeFn) return false
  const data = boundDeserializeFn(text)
  if (!data) return false
  const rootChildren = data.relationships[ROOT_ID] ?? []
  if (rootChildren.length === 0) return false
  clipboardBuffer = data
  clipboardMode = 'copy'
  cutSourceIds = []
  return true
}

/** Check if a deserialize function is bound */
export function hasDeserialize(): boolean {
  return !!boundDeserializeFn
}

/** Serialize clipboard buffer using bound serialize function */
function serializeBuffer(store: NormalizedData): void {
  if (!boundSerializeFn) {
    serializedText = null
    return
  }
  const rootChildren = clipboardBuffer.relationships[ROOT_ID] ?? []
  if (rootChildren.length === 0) {
    serializedText = null
    return
  }
  try {
    serializedText = boundSerializeFn(clipboardBuffer, store)
  } catch {
    serializedText = null
  }
}

/** Reset clipboard state -- use in tests to isolate state between cases */
export function resetClipboard(): void {
  clipboardBuffer = createStore()
  clipboardMode = 'copy'
  cutSourceIds = []
  cellValueBuffer = ''
  cellRangeBuffer = []
  serializedText = null
  resetMergeIdCounter()
}

/** Normalize CanAcceptResult: true -> 'insert', false -> false */
function normalizeAcceptResult(result: CanAcceptResult): 'insert' | 'overwrite' | false {
  if (result === true) return 'insert'
  if (result === false) return false
  return result
}

/**
 * Find the paste target for a given node.
 *
 * With canAccept: walk up from targetId until an ancestor accepts the child type.
 * Without canAccept: container (has relationships) -> inside, leaf -> sibling.
 *
 * Returns mode to distinguish insert vs overwrite.
 */
function findPasteTarget(
  store: NormalizedData,
  targetId: string,
  childData: Record<string, unknown> | undefined,
  canAcceptFn?: CanAcceptFn,
): { pasteInto: string; insertIndex: number | undefined; mode: 'insert' | 'overwrite' } {
  if (canAcceptFn) {
    // Schema-based routing: walk up from target to find first accepting ancestor
    let candidate: string | undefined = targetId
    while (candidate) {
      const candidateData = getEntity(store, candidate)?.data as Record<string, unknown> | undefined
      const result = normalizeAcceptResult(canAcceptFn(candidateData, childData))

      if (result === 'overwrite' && candidate === targetId) {
        // Only overwrite if the parent is a slot (non-collection).
        // In collection parents (array), prefer insert as sibling.
        const parentId = getParent(store, candidate)
        if (parentId) {
          const parentData = getEntity(store, parentId)?.data as Record<string, unknown> | undefined
          const parentAccept = normalizeAcceptResult(canAcceptFn(parentData, childData))
          if (parentAccept === 'insert') {
            // Parent is a collection that accepts this type — skip overwrite, let walk-up find parent
            candidate = getParent(store, candidate)
            continue
          }
        }
        return { pasteInto: candidate, insertIndex: undefined, mode: 'overwrite' }
      }

      if (result === 'insert') {
        if (candidate === targetId) {
          return { pasteInto: candidate, insertIndex: undefined, mode: 'insert' }
        }
        const children = getChildren(store, candidate)
        let ancestorChild = targetId
        let parent = getParent(store, ancestorChild)
        while (parent && parent !== candidate) {
          ancestorChild = parent
          parent = getParent(store, ancestorChild)
        }
        const pos = children.indexOf(ancestorChild)
        return { pasteInto: candidate, insertIndex: pos >= 0 ? pos + 1 : undefined, mode: 'insert' }
      }

      candidate = getParent(store, candidate)
    }
    return { pasteInto: ROOT_ID, insertIndex: undefined, mode: 'insert' }
  }

  // Default: container -> inside, leaf -> sibling after
  const isContainer = targetId in store.relationships
  const pasteInto = isContainer
    ? targetId
    : (getParent(store, targetId) ?? ROOT_ID)

  let insertIndex: number | undefined
  if (!isContainer) {
    const siblings = getChildren(store, pasteInto)
    const targetPos = siblings.indexOf(targetId)
    if (targetPos >= 0) insertIndex = targetPos + 1
  }

  return { pasteInto, insertIndex, mode: 'insert' }
}

/** Extract editable field values from entity data. */
function extractOverwriteFields(
  sourceData: Record<string, unknown>,
): Record<string, unknown> {
  const fields: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(sourceData)) {
    if (key === 'type' || key === 'role') continue
    fields[key] = value
  }
  return fields
}

function getCells(store: NormalizedData, nodeId: string): string[] {
  const entity = getEntity(store, nodeId)
  return [...(((entity?.data as Record<string, unknown>)?.cells as unknown[]) ?? [])] as string[]
}

export const clipboardCommands = defineCommands({
  copyCellValue: {
    type: COPY_CELL,
    create: (nodeId: string, colIndex: number) => ({ nodeId, colIndex }),
    handler: (store, { nodeId, colIndex }) => {
      cellValueBuffer = getCells(store, nodeId)[colIndex] ?? ''
      return store
    },
  },

  clearCellValue: {
    type: CLEAR_CELL,
    create: (nodeId: string, colIndex: number) => ({ nodeId, colIndex }),
    handler: (store, { nodeId, colIndex }) => {
      const cells = getCells(store, nodeId)
      if ((cells[colIndex] ?? '') === '') return store
      cells[colIndex] = ''
      return updateEntityData(store, nodeId, { cells })
    },
  },

  cutCellValue: {
    type: CUT_CELL,
    create: (nodeId: string, colIndex: number) => ({ nodeId, colIndex }),
    handler: (store, { nodeId, colIndex }) => {
      const cells = getCells(store, nodeId)
      cellValueBuffer = cells[colIndex] ?? ''
      cells[colIndex] = ''
      return updateEntityData(store, nodeId, { cells })
    },
  },

  pasteCellValue: {
    type: PASTE_CELL,
    create: (nodeId: string, colIndex: number) => ({ nodeId, colIndex }),
    handler: (store, { nodeId, colIndex }) => {
      if (cellValueBuffer === '') return store
      const cells = getCells(store, nodeId)
      cells[colIndex] = cellValueBuffer
      return updateEntityData(store, nodeId, { cells })
    },
  },

  copy: {
    type: COPY,
    create: (nodeIds: string[]) => ({ nodeIds }),
    handler: (store, { nodeIds }) => {
      // ② engine-validator-clipboard-prd.md — use extractSubtree
      clipboardBuffer = extractSubtree(store, nodeIds as string[])
      clipboardMode = 'copy'
      cutSourceIds = []
      serializeBuffer(store)
      return store
    },
  },

  cut: {
    type: CUT,
    create: (nodeIds: string[]) => ({ nodeIds }),
    handler: (store, { nodeIds }) => {
      // ② engine-validator-clipboard-prd.md — canDeleteFn removed, validator handles rejection
      const ids = nodeIds as string[]
      if (ids.length === 0) return store
      clipboardBuffer = extractSubtree(store, ids)
      clipboardMode = 'cut'
      cutSourceIds = [...ids]
      serializeBuffer(store)
      return store
    },
  },

  paste: {
    type: PASTE,
    create: (targetId: string, canAcceptFn?: CanAcceptFn) => ({ targetId, canAcceptFn }),
    handler: (store, { targetId, canAcceptFn }) => {
      const buffer = clipboardBuffer
      const mode = clipboardMode
      const sourceIds = [...cutSourceIds]

      const rootChildren = buffer.relationships[ROOT_ID] ?? []
      if (rootChildren.length === 0) return store

      const firstId = rootChildren[0]!
      const childData = buffer.entities[firstId]?.data as Record<string, unknown> | undefined
      const { pasteInto, insertIndex: initialInsertIndex, mode: pasteMode } = findPasteTarget(store, targetId, childData, canAcceptFn)

      if (pasteMode === 'overwrite') {
        if (!childData) return store
        const fields = extractOverwriteFields(childData)
        if (Object.keys(fields).length === 0) return store
        return updateEntityData(store, targetId, fields)
      }

      let insertIndex = initialInsertIndex
      let result = store

      if (mode === 'cut') {
        for (const id of sourceIds) {
          result = removeEntity(result, id)
        }
        if (insertIndex !== undefined) {
          const siblings = getChildren(result, pasteInto)
          let refNode = targetId
          if (canAcceptFn && pasteInto !== getParent(store, targetId)) {
            let current = targetId
            let parent = getParent(store, current)
            while (parent && parent !== pasteInto) {
              current = parent
              parent = getParent(store, current)
            }
            refNode = current
          }
          const targetPos = siblings.indexOf(refNode)
          insertIndex = targetPos >= 0 ? targetPos + 1 : undefined
        }
        // ② engine-validator-clipboard-prd.md — use mergeSubtree, no new IDs for cut
        result = mergeSubtree(result, buffer, pasteInto, insertIndex, false)
        clipboardBuffer = createStore()
        cutSourceIds = []
      } else {
        // ② engine-validator-clipboard-prd.md — use mergeSubtree with new IDs for copy
        result = mergeSubtree(result, buffer, pasteInto, insertIndex, true)
      }

      return result
    },
  },

  duplicateAfter: {
    type: 'clipboard:duplicateAfter' as const,
    create: (targetId: string) => ({ targetId }),
    handler: (store, { targetId }) => {
      const rootChildren = clipboardBuffer.relationships[ROOT_ID] ?? []
      if (rootChildren.length === 0) return store

      const parentId = getParent(store, targetId as string) ?? ROOT_ID
      const siblings = getChildren(store, parentId)
      const pos = siblings.indexOf(targetId as string)
      const insertIndex = pos >= 0 ? pos + 1 : undefined

      return mergeSubtree(store, clipboardBuffer, parentId, insertIndex, true)
    },
  },

  // ② grid-cell-range-prd.md — 2D batch clear. col 0 (read-only key column) is excluded.
  clearCellRange: {
    type: CLEAR_CELL_RANGE,
    create: (cells: CellTarget[]) => ({ cells }),
    handler: (store, { cells }) => {
      const byRow = new Map<string, number[]>()
      for (const c of cells) {
        if (c.col === 0) continue // col 0 is read-only
        const arr = byRow.get(c.rowId) ?? []
        arr.push(c.col)
        byRow.set(c.rowId, arr)
      }
      let result = store
      for (const [rowId, cols] of byRow) {
        const cellsArr = getCells(result, rowId)
        let dirty = false
        for (const col of cols) {
          if ((cellsArr[col] ?? '') !== '') {
            cellsArr[col] = ''
            dirty = true
          }
        }
        if (dirty) result = updateEntityData(result, rowId, { cells: cellsArr })
      }
      return result
    },
  },

  // ② grid-cell-range-prd.md — capture rect into 2D buffer. width derives row split.
  copyCellRange: {
    type: COPY_CELL_RANGE,
    meta: true,
    create: (cells: CellTarget[], width: number) => ({ cells, width }),
    handler: (store, { cells, width }) => {
      if (width <= 0 || cells.length === 0) {
        cellRangeBuffer = []
        return store
      }
      const rows: string[][] = []
      for (let i = 0; i < cells.length; i += width) {
        const row: string[] = []
        for (let j = 0; j < width; j++) {
          const c = cells[i + j]
          if (!c) break
          row.push(getCells(store, c.rowId)[c.col] ?? '')
        }
        rows.push(row)
      }
      cellRangeBuffer = rows
      return store
    },
  },

  // ② grid-cell-range-prd.md — paste 2D buffer at (anchorNodeId, anchorCol).
  // Row order is taken from the anchor's siblings (flat-grid assumption).
  // col 0 (read-only key column) is skipped on write.
  pasteCellRange: {
    type: PASTE_CELL_RANGE,
    create: (anchorNodeId: string, anchorCol: number) => ({ anchorNodeId, anchorCol }),
    handler: (store, { anchorNodeId, anchorCol }) => {
      const buffer = cellRangeBuffer
      if (buffer.length === 0) return store
      const parentId = getParent(store, anchorNodeId) ?? ROOT_ID
      const siblings = getChildren(store, parentId)
      const startIdx = siblings.indexOf(anchorNodeId)
      if (startIdx < 0) return store
      let result = store
      for (let r = 0; r < buffer.length; r++) {
        const rowId = siblings[startIdx + r]
        if (!rowId) break
        const row = buffer[r]!
        const cellsArr = getCells(result, rowId)
        let dirty = false
        for (let c = 0; c < row.length; c++) {
          const colIdx = anchorCol + c
          if (colIdx === 0) continue // col 0 is read-only
          if (colIdx >= cellsArr.length) break
          if (cellsArr[colIdx] !== row[c]) {
            cellsArr[colIdx] = row[c]!
            dirty = true
          }
        }
        if (dirty) result = updateEntityData(result, rowId, { cells: cellsArr })
      }
      return result
    },
  },
})

export interface ClipboardOptions {
  /** @deprecated Use zodSchema() plugin instead. */
  canAccept?: CanAcceptFn
  /** @deprecated Use zodSchema() plugin instead. */
  canDelete?: CanDeleteFn
  /** Convert copied subtree to text for system clipboard */
  serialize?: ClipboardSerializeFn
  /** Convert pasted text from system clipboard to tree data */
  deserialize?: ClipboardDeserializeFn
}

export function clipboard(options?: ClipboardOptions) {
  const boundCanAccept = options?.canAccept
  const boundCanDelete = options?.canDelete
  boundSerializeFn = options?.serialize
  boundDeserializeFn = options?.deserialize

  if (boundCanAccept || boundCanDelete) {
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      console.warn('[clipboard] canAccept/canDelete options are deprecated. Use zodSchema() plugin instead.')
    }
  }

  return definePlugin({
    name: 'clipboard',
    commands: {
      [COPY]: clipboardCommands.copy,
      [CUT]: clipboardCommands.cut,
      [PASTE]: clipboardCommands.paste,
      [COPY_CELL]: clipboardCommands.copyCellValue,
      [PASTE_CELL]: clipboardCommands.pasteCellValue,
      [CLEAR_CELL]: clipboardCommands.clearCellValue,
      [CUT_CELL]: clipboardCommands.cutCellValue,
      [COPY_CELL_RANGE]: clipboardCommands.copyCellRange,
      [PASTE_CELL_RANGE]: clipboardCommands.pasteCellRange,
      [CLEAR_CELL_RANGE]: clipboardCommands.clearCellRange,
      'clipboard:duplicateAfter': clipboardCommands.duplicateAfter,
    },
    keyMap: {
      'Mod+D': key(['clipboard:copy', 'clipboard:duplicateAfter'], (ctx) => {
        const ids = resolveTargetIds(ctx)
        ctx.dispatch(clipboardCommands.copy(ids))
        return clipboardCommands.duplicateAfter(ids.at(-1)!)
      }),
    },
    onCopy: (ctx: {
      focused: string
      selected?: { ids: string[] }
      grid?: { cellRange?: { cells: CellTarget[]; rect: { c0: number; c1: number } | null } | null } | null
    }) => {
      const cells = resolveCellTargets(ctx)
      if (cells) {
        const rect = ctx.grid?.cellRange?.rect
        const width = rect ? rect.c1 - rect.c0 + 1 : 1
        // Reset row-level buffer so subsequent paste routes to cellRange.
        clipboardBuffer = createStore()
        cutSourceIds = []
        return clipboardCommands.copyCellRange(cells, width)
      }
      cellRangeBuffer = []
      return clipboardCommands.copy(resolveTargetIds(ctx))
    },
    onCut: (ctx: {
      focused: string
      selected?: { ids: string[] }
      grid?: { cellRange?: { cells: CellTarget[]; rect: { c0: number; c1: number } | null } | null } | null
    }) => {
      const cells = resolveCellTargets(ctx)
      if (cells) {
        // Cell-level cut = copy + clear (col 0 excluded inside clearCellRange).
        const rect = ctx.grid?.cellRange?.rect
        const width = rect ? rect.c1 - rect.c0 + 1 : 1
        clipboardBuffer = createStore()
        cutSourceIds = []
        return { type: 'batch', commands: [
          clipboardCommands.copyCellRange(cells, width),
          clipboardCommands.clearCellRange(cells),
        ] } as Command
      }
      cellRangeBuffer = []
      return clipboardCommands.cut(resolveTargetIds(ctx))
    },
    onPaste: (ctx: {
      focused: string
      grid?: { colIndex?: number; cellRange?: unknown } | null
    }) => {
      if (cellRangeBuffer.length > 0) {
        const colIndex = ctx.grid?.colIndex ?? 0
        return clipboardCommands.pasteCellRange(ctx.focused, colIndex)
      }
      return clipboardCommands.paste(ctx.focused, boundCanAccept)
    },
  })
}
`;export{e as default};
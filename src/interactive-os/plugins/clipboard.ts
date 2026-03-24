import type { Command } from '../engine/types'
import type { Entity, NormalizedData } from '../store/types'
import { ROOT_ID } from '../store/types'
import {
  addEntity,
  removeEntity,
  getEntity,
  getChildren,
  getParent,
  updateEntityData,
} from '../store/createStore'
import { definePlugin } from './definePlugin'

interface ClipboardEntry {
  entity: Entity
  children: ClipboardEntry[]
}

/** Schema-based paste routing result:
 *  - 'insert': add as new child (collection)
 *  - 'overwrite': replace editable fields of existing node (slot)
 *  - false: reject paste
 *  - boolean backward compat: true → 'insert', false → false */
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

// ── Command TYPE constants ──

export const COPY = 'clipboard:copy' as const
export const CUT = 'clipboard:cut' as const
export const PASTE = 'clipboard:paste' as const
export const COPY_CELL = 'clipboard:copyCellValue' as const
export const PASTE_CELL = 'clipboard:pasteCellValue' as const
export const CLEAR_CELL = 'clipboard:clearCellValue' as const
export const CUT_CELL_VALUE = 'clipboard:cutCellValue' as const

// ── Module-level clipboard data (shared — OS clipboard model) ──

let clipboardBuffer: ClipboardEntry[] = []
let clipboardMode: 'copy' | 'cut' = 'copy'
let cutSourceIds: string[] = []
let cellValueBuffer: string = ''

/** Read-only access to cut source IDs — for UI cut-state styling */
export function getCutSourceIds(): readonly string[] {
  return cutSourceIds
}

/** Reset clipboard state — use in tests to isolate state between cases */
export function resetClipboard(): void {
  clipboardBuffer = []
  clipboardMode = 'copy'
  cutSourceIds = []
  cellValueBuffer = ''
  idCounter = 0
}

function collectSubtree(store: NormalizedData, nodeId: string): ClipboardEntry {
  const entity = getEntity(store, nodeId)!
  const childIds = getChildren(store, nodeId)
  return {
    entity: { ...entity },
    children: childIds.map((id) => collectSubtree(store, id)),
  }
}

let idCounter = 0
function generateId(originalId: string): string {
  return `${originalId}-copy-${++idCounter}`
}

function insertClipboardEntry(
  store: NormalizedData,
  entry: ClipboardEntry,
  parentId: string,
  generateNewIds: boolean,
  index?: number,
): NormalizedData {
  const newId = generateNewIds ? generateId(entry.entity.id) : entry.entity.id
  const newEntity = { ...entry.entity, id: newId }

  let result = addEntity(store, newEntity, parentId, index)

  for (const child of entry.children) {
    result = insertClipboardEntry(result, child, newId, generateNewIds)
  }

  return result
}

/** Normalize CanAcceptResult: true → 'insert', false → false */
function normalizeAcceptResult(result: CanAcceptResult): 'insert' | 'overwrite' | false {
  if (result === true) return 'insert'
  if (result === false) return false
  return result
}

/** Check if a node can be deleted/cut based on its parent's canDelete. */
function canDeleteNode(store: NormalizedData, nodeId: string, canDeleteFn?: CanDeleteFn): boolean {
  if (!canDeleteFn) return true
  const parentId = getParent(store, nodeId)
  if (!parentId) return true // ROOT-level
  const parentData = getEntity(store, parentId)?.data as Record<string, unknown> | undefined
  return canDeleteFn(parentData)
}

/**
 * Find the paste target for a given node.
 *
 * With canAccept: walk up from targetId until an ancestor accepts the child type.
 * Without canAccept: container (has relationships) → inside, leaf → sibling.
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

  // Default: container → inside, leaf → sibling after
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
  return [...((entity?.data as Record<string, unknown>)?.cells ?? [])] as string[]
}

export const clipboardCommands = {
  copyCellValue(nodeId: string, colIndex: number): Command {
    return {
      type: COPY_CELL,
      payload: { nodeId, colIndex },
      execute(store) {
        cellValueBuffer = getCells(store, nodeId)[colIndex] ?? ''
        return store
      },
      undo(store) { return store },
    }
  },

  clearCellValue(nodeId: string, colIndex: number): Command {
    let previousValue: string = ''
    return {
      type: CLEAR_CELL,
      payload: { nodeId, colIndex },
      execute(store) {
        const cells = getCells(store, nodeId)
        previousValue = cells[colIndex] ?? ''
        if (previousValue === '') return store
        cells[colIndex] = ''
        return updateEntityData(store, nodeId, { cells })
      },
      undo(store) {
        const cells = getCells(store, nodeId)
        cells[colIndex] = previousValue
        return updateEntityData(store, nodeId, { cells })
      },
    }
  },

  cutCellValue(nodeId: string, colIndex: number): Command {
    let previousValue: string = ''
    return {
      type: CUT_CELL_VALUE,
      payload: { nodeId, colIndex },
      execute(store) {
        const cells = getCells(store, nodeId)
        previousValue = cells[colIndex] ?? ''
        cellValueBuffer = previousValue
        cells[colIndex] = ''
        return updateEntityData(store, nodeId, { cells })
      },
      undo(store) {
        const cells = getCells(store, nodeId)
        cells[colIndex] = previousValue
        return updateEntityData(store, nodeId, { cells })
      },
    }
  },

  pasteCellValue(nodeId: string, colIndex: number): Command {
    let previousValue: string = ''
    return {
      type: PASTE_CELL,
      payload: { nodeId, colIndex },
      execute(store) {
        if (cellValueBuffer === '') return store
        const cells = getCells(store, nodeId)
        previousValue = cells[colIndex] ?? ''
        cells[colIndex] = cellValueBuffer
        return updateEntityData(store, nodeId, { cells })
      },
      undo(store) {
        const cells = getCells(store, nodeId)
        cells[colIndex] = previousValue
        return updateEntityData(store, nodeId, { cells })
      },
    }
  },

  copy(nodeIds: string[]): Command {
    return {
      type: COPY,
      payload: { nodeIds },
      execute(store) {
        clipboardBuffer = nodeIds.map((id) => collectSubtree(store, id))
        clipboardMode = 'copy'
        cutSourceIds = []
        return store
      },
      undo(store) { return store },
    }
  },

  cut(nodeIds: string[], canDeleteFn?: CanDeleteFn): Command {
    return {
      type: CUT,
      payload: { nodeIds },
      execute(store) {
        const deletable = nodeIds.filter((id) => canDeleteNode(store, id, canDeleteFn))
        if (deletable.length === 0) return store

        clipboardBuffer = deletable.map((id) => collectSubtree(store, id))
        clipboardMode = 'cut'
        cutSourceIds = [...deletable]
        return store
      },
      undo(store) { return store },
    }
  },

  paste(targetId: string, canAcceptFn?: CanAcceptFn): Command {
    let buffer: ClipboardEntry[] = []
    let mode: 'copy' | 'cut' = 'copy'
    let sourceIds: string[] = []
    const pastedIds: string[] = []
    let overwriteSnapshot: { nodeId: string; oldData: Record<string, unknown> } | null = null

    return {
      type: PASTE,
      payload: { targetId },
      execute(store) {
        buffer = [...clipboardBuffer]
        mode = clipboardMode
        sourceIds = [...cutSourceIds]

        if (buffer.length === 0) return store

        const childData = buffer[0]!.entity.data as Record<string, unknown> | undefined
        const { pasteInto, insertIndex: initialInsertIndex, mode: pasteMode } = findPasteTarget(store, targetId, childData, canAcceptFn)

        // Overwrite mode
        if (pasteMode === 'overwrite') {
          if (!childData) return store
          const fields = extractOverwriteFields(childData)
          if (Object.keys(fields).length === 0) return store

          const existing = getEntity(store, targetId)
          overwriteSnapshot = {
            nodeId: targetId,
            oldData: { ...(existing?.data as Record<string, unknown> ?? {}) },
          }

          return updateEntityData(store, targetId, fields)
        }

        // Insert mode
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
          for (let i = 0; i < buffer.length; i++) {
            const entry = buffer[i]!
            const idx = insertIndex !== undefined ? insertIndex + i : undefined
            result = insertClipboardEntry(result, entry, pasteInto, false, idx)
            pastedIds.push(entry.entity.id)
          }
          clipboardBuffer = []
          cutSourceIds = []
        } else {
          for (let i = 0; i < buffer.length; i++) {
            const entry = buffer[i]!
            const idx = insertIndex !== undefined ? insertIndex + i : undefined
            const beforeIds = new Set(Object.keys(result.entities))
            result = insertClipboardEntry(result, entry, pasteInto, true, idx)
            const afterIds = Object.keys(result.entities)
            for (const id of afterIds) {
              if (!beforeIds.has(id)) pastedIds.push(id)
            }
          }
        }

        return result
      },
      undo(store) {
        if (overwriteSnapshot) {
          return updateEntityData(store, overwriteSnapshot.nodeId, overwriteSnapshot.oldData)
        }

        if (pastedIds.length === 0) return store

        let result = store

        if (mode === 'cut') {
          for (const id of pastedIds) {
            result = removeEntity(result, id)
          }
          for (const entry of buffer) {
            result = insertClipboardEntry(result, entry, ROOT_ID, false)
          }
        } else {
          for (const id of pastedIds) {
            result = removeEntity(result, id)
          }
        }

        return result
      },
    }
  },
}

export interface ClipboardOptions {
  /** @deprecated Use zodSchema() plugin instead. */
  canAccept?: CanAcceptFn
  /** @deprecated Use zodSchema() plugin instead. */
  canDelete?: CanDeleteFn
}

export function clipboard(options?: ClipboardOptions) {
  const boundCanAccept = options?.canAccept
  const boundCanDelete = options?.canDelete

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
      [CUT_CELL_VALUE]: clipboardCommands.cutCellValue,
    },
    onCopy: (ctx: { focused: string; selected: string[] }) =>
      clipboardCommands.copy(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
    onCut: (ctx: { focused: string; selected: string[] }) =>
      clipboardCommands.cut(ctx.selected.length > 0 ? ctx.selected : [ctx.focused], boundCanDelete),
    onPaste: (ctx: { focused: string }) =>
      clipboardCommands.paste(ctx.focused, boundCanAccept),
  })
}

import type { Command, Entity, NormalizedData, Plugin } from '../core/types'
import { ROOT_ID } from '../core/types'
import {
  addEntity,
  removeEntity,
  getEntity,
  getChildren,
  getParent,
  updateEntityData,
} from '../core/createStore'

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

// Module-level clipboard state (shared across instances)
let clipboardBuffer: ClipboardEntry[] = []
let clipboardMode: 'copy' | 'cut' = 'copy'
let cutSourceIds: string[] = []
let canAcceptFn: CanAcceptFn | undefined
let canDeleteFn: CanDeleteFn | undefined

/** Read-only access to cut source IDs — for UI cut-state styling */
export function getCutSourceIds(): readonly string[] {
  return cutSourceIds
}

/** Reset clipboard state — use in tests to isolate state between cases */
export function resetClipboard(): void {
  clipboardBuffer = []
  clipboardMode = 'copy'
  cutSourceIds = []
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
function canDeleteNode(store: NormalizedData, nodeId: string): boolean {
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
): { pasteInto: string; insertIndex: number | undefined; mode: 'insert' | 'overwrite' } {
  if (canAcceptFn) {
    // Schema-based routing: walk up from target to find first accepting ancestor
    let candidate: string | undefined = targetId
    while (candidate) {
      const candidateData = getEntity(store, candidate)?.data as Record<string, unknown> | undefined
      const result = normalizeAcceptResult(canAcceptFn(candidateData, childData))

      if (result === 'overwrite' && candidate === targetId) {
        // Overwrite: target itself is the slot node to replace
        return { pasteInto: candidate, insertIndex: undefined, mode: 'overwrite' }
      }

      if (result === 'insert') {
        if (candidate === targetId) {
          // Target itself accepts → paste as child (append)
          return { pasteInto: candidate, insertIndex: undefined, mode: 'insert' }
        }
        // Ancestor accepts → insert after the direct child that contains targetId
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

      // result === false or overwrite but not target → skip, walk up
      candidate = getParent(store, candidate)
    }
    // No ancestor accepted → paste at ROOT as last resort
    return { pasteInto: ROOT_ID, insertIndex: undefined, mode: 'insert' }
  }

  // Legacy behavior: container → inside, leaf → sibling
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

/** Extract editable field values from entity data.
 *  "Editable" = fields with .describe() in the Zod schema.
 *  Since we don't have schema access here, we copy all fields except 'type' and 'role'
 *  which are structural. The canAccept already validated type compatibility. */
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

export const clipboardCommands = {
  copy(nodeIds: string[]): Command {
    return {
      type: 'clipboard:copy',
      payload: { nodeIds },
      execute(store) {
        clipboardBuffer = nodeIds.map((id) => collectSubtree(store, id))
        clipboardMode = 'copy'
        cutSourceIds = []
        return store // copy doesn't modify store
      },
      undo(store) {
        return store // copy is not undoable (no store change)
      },
    }
  },

  cut(nodeIds: string[]): Command {
    return {
      type: 'clipboard:cut',
      payload: { nodeIds },
      execute(store) {
        // Filter out nodes that can't be deleted (slot children)
        const deletable = nodeIds.filter((id) => canDeleteNode(store, id))
        if (deletable.length === 0) return store

        clipboardBuffer = deletable.map((id) => collectSubtree(store, id))
        clipboardMode = 'cut'
        cutSourceIds = [...deletable]
        return store // cut doesn't modify store until paste
      },
      undo(store) {
        return store
      },
    }
  },

  paste(targetId: string): Command {
    // Clipboard state is captured at execute time (not creation time) so that
    // copy/cut dispatched before paste is reflected correctly
    let buffer: ClipboardEntry[] = []
    let mode: 'copy' | 'cut' = 'copy'
    let sourceIds: string[] = []
    const pastedIds: string[] = []
    let overwriteSnapshot: { nodeId: string; oldData: Record<string, unknown> } | null = null

    return {
      type: 'clipboard:paste',
      payload: { targetId },
      execute(store) {
        // Capture clipboard state at execute time
        buffer = [...clipboardBuffer]
        mode = clipboardMode

        sourceIds = [...cutSourceIds]

        if (buffer.length === 0) return store

        // Determine paste location using schema or legacy logic.
        // Note: uses first buffer entry's type for routing. Mixed-type selections
        // are assumed homogeneous — CMS only copies same-type siblings.
        const childData = buffer[0]!.entity.data as Record<string, unknown> | undefined
        const { pasteInto, insertIndex: initialInsertIndex, mode: pasteMode } = findPasteTarget(store, targetId, childData)

        // Overwrite mode: replace editable fields on target node
        if (pasteMode === 'overwrite') {
          if (!childData) return store
          const fields = extractOverwriteFields(childData)
          if (Object.keys(fields).length === 0) return store

          // Snapshot for undo
          const existing = getEntity(store, targetId)
          overwriteSnapshot = {
            nodeId: targetId,
            oldData: { ...(existing?.data as Record<string, unknown> ?? {}) },
          }

          return updateEntityData(store, targetId, fields)
        }

        // Insert mode (collection or legacy)
        let insertIndex = initialInsertIndex
        let result = store

        if (mode === 'cut') {
          // Remove from source first
          for (const id of sourceIds) {
            result = removeEntity(result, id)
          }
          // Recalculate index after removals (siblings may have shifted)
          if (insertIndex !== undefined) {
            const siblings = getChildren(result, pasteInto)
            // Find the reference node for position calculation
            let refNode = targetId
            if (canAcceptFn && pasteInto !== getParent(store, targetId)) {
              // Walking up happened — find the ancestor child
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
          // Insert at target with original IDs
          for (let i = 0; i < buffer.length; i++) {
            const entry = buffer[i]!
            const idx = insertIndex !== undefined ? insertIndex + i : undefined
            result = insertClipboardEntry(result, entry, pasteInto, false, idx)
            pastedIds.push(entry.entity.id)
          }
          // Clear clipboard after cut-paste
          clipboardBuffer = []
          cutSourceIds = []
        } else {
          // Copy: insert with new IDs at position
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
        // Undo overwrite: restore old data
        if (overwriteSnapshot) {
          return updateEntityData(store, overwriteSnapshot.nodeId, overwriteSnapshot.oldData)
        }

        if (pastedIds.length === 0) return store

        let result = store

        if (mode === 'cut') {
          // Remove pasted nodes from target
          for (const id of pastedIds) {
            result = removeEntity(result, id)
          }
          // Restore at original locations
          for (const entry of buffer) {
            // We need to find original parent — stored in the entry context
            // For simplicity, we add back to root; history plugin's snapshot handles correctness
            result = insertClipboardEntry(result, entry, ROOT_ID, false)
          }
        } else {
          // Remove cloned nodes
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
  /** Schema-based paste routing. When provided, paste walks up from target
   *  to find the first ancestor where canAccept returns true.
   *  Return 'insert' for collection, 'overwrite' for slot, false to reject.
   *  Boolean return is backward compatible: true → 'insert', false → false. */
  canAccept?: CanAcceptFn
  /** Slot protection. When provided, cut filters out nodes whose parent
   *  returns false. Use to prevent cutting structural children. */
  canDelete?: CanDeleteFn
}

/** Clipboard is a singleton plugin — clipboardBuffer and canAccept are module-level
 *  shared state. Call clipboard() once per application. */
export function clipboard(options?: ClipboardOptions): Plugin {
  canAcceptFn = options?.canAccept
  canDeleteFn = options?.canDelete
  return {
    commands: {
      copy: clipboardCommands.copy,
      cut: clipboardCommands.cut,
      paste: clipboardCommands.paste,
    },
    keyMap: {
      'Mod+C': (ctx: { focused: string; selected: string[] }) =>
        clipboardCommands.copy(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
      'Mod+X': (ctx: { focused: string; selected: string[] }) =>
        clipboardCommands.cut(ctx.selected.length > 0 ? ctx.selected : [ctx.focused]),
      'Mod+V': (ctx: { focused: string }) =>
        clipboardCommands.paste(ctx.focused),
    },
  }
}

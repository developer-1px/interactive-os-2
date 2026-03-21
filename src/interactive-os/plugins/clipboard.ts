import type { Command, Entity, NormalizedData, Plugin } from '../core/types'
import { ROOT_ID } from '../core/types'
import {
  addEntity,
  removeEntity,
  getEntity,
  getChildren,
  getParent,
} from '../core/createStore'

interface ClipboardEntry {
  entity: Entity
  children: ClipboardEntry[]
}

/** Schema-based paste routing: can parentData accept childData as a child? */
export type CanAcceptFn = (
  parentData: Record<string, unknown> | undefined,
  childData: Record<string, unknown> | undefined,
) => boolean

// Module-level clipboard state (shared across instances)
let clipboardBuffer: ClipboardEntry[] = []
let clipboardMode: 'copy' | 'cut' = 'copy'
let cutSourceIds: string[] = []
let canAcceptFn: CanAcceptFn | undefined

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

/**
 * Find the paste target for a given node.
 *
 * With canAccept: walk up from targetId until an ancestor accepts the child type.
 * Without canAccept: container (has relationships) → inside, leaf → sibling.
 */
function findPasteTarget(
  store: NormalizedData,
  targetId: string,
  childData: Record<string, unknown> | undefined,
): { pasteInto: string; insertIndex: number | undefined } {
  if (canAcceptFn) {
    // Schema-based routing: walk up from target to find first accepting ancestor
    let candidate: string | undefined = targetId
    while (candidate) {
      const candidateData = getEntity(store, candidate)?.data as Record<string, unknown> | undefined
      if (canAcceptFn(candidateData, childData)) {
        if (candidate === targetId) {
          // Target itself accepts → paste as child (append)
          return { pasteInto: candidate, insertIndex: undefined }
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
        return { pasteInto: candidate, insertIndex: pos >= 0 ? pos + 1 : undefined }
      }
      candidate = getParent(store, candidate)
    }
    // No ancestor accepted → paste at ROOT as last resort
    return { pasteInto: ROOT_ID, insertIndex: undefined }
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

  return { pasteInto, insertIndex }
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
        clipboardBuffer = nodeIds.map((id) => collectSubtree(store, id))
        clipboardMode = 'cut'
        cutSourceIds = [...nodeIds]
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
        const { pasteInto, insertIndex: initialInsertIndex } = findPasteTarget(store, targetId, childData)
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
   *  to find the first ancestor where canAccept returns true. */
  canAccept?: CanAcceptFn
}

/** Clipboard is a singleton plugin — clipboardBuffer and canAccept are module-level
 *  shared state. Call clipboard() once per application. */
export function clipboard(options?: ClipboardOptions): Plugin {
  canAcceptFn = options?.canAccept
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

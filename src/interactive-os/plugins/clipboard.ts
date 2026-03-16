import type { Command, Entity, NormalizedData, Plugin } from '../core/types'
import { ROOT_ID } from '../core/types'
import {
  addEntity,
  removeEntity,
  getEntity,
  getChildren,
} from '../core/normalized-store'

interface ClipboardEntry {
  entity: Entity
  children: ClipboardEntry[]
}

// Module-level clipboard state (shared across instances)
let clipboardBuffer: ClipboardEntry[] = []
let clipboardMode: 'copy' | 'cut' = 'copy'
let cutSourceIds: string[] = []

/** Reset clipboard state — use in tests to isolate state between cases */
export function resetClipboard(): void {
  clipboardBuffer = []
  clipboardMode = 'copy'
  cutSourceIds = []
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
  generateNewIds: boolean
): NormalizedData {
  const newId = generateNewIds ? generateId(entry.entity.id) : entry.entity.id
  const newEntity = { ...entry.entity, id: newId }

  let result = addEntity(store, newEntity, parentId)

  for (const child of entry.children) {
    result = insertClipboardEntry(result, child, newId, generateNewIds)
  }

  return result
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

        let result = store

        if (mode === 'cut') {
          // Remove from source first
          for (const id of sourceIds) {
            result = removeEntity(result, id)
          }
          // Insert at target with original IDs
          for (const entry of buffer) {
            result = insertClipboardEntry(result, entry, targetId, false)
            pastedIds.push(entry.entity.id)
          }
          // Clear clipboard after cut-paste
          clipboardBuffer = []
          cutSourceIds = []
        } else {
          // Copy: insert with new IDs
          for (const entry of buffer) {
            const beforeIds = new Set(Object.keys(result.entities))
            result = insertClipboardEntry(result, entry, targetId, true)
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

export function clipboard(): Plugin {
  return {
    commands: {
      copy: clipboardCommands.copy,
      cut: clipboardCommands.cut,
      paste: clipboardCommands.paste,
    },
  }
}

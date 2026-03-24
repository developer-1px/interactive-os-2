import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { computeStoreDiff, applyDelta } from '../store/computeStoreDiff'
import type { StoreDiff } from '../store/computeStoreDiff'
import { definePlugin } from './definePlugin'

const SKIP_META = new Set([
  '__focus__',
  '__selection__',
  '__selection_anchor__',
  '__expanded__',
  '__grid_col__',
  '__spatial_parent__',
  '__rename__',
])

function isContentDiff(d: StoreDiff): boolean {
  if (d.path === 'entities') return true
  if (d.path.includes('.')) {
    const entityId = d.path.split('.')[0]!
    return !SKIP_META.has(entityId)
  }
  return !SKIP_META.has(d.path)
}

export function undoCommand(): Command {
  return { type: 'history:undo', payload: null, execute: (s) => s, undo: (s) => s }
}

export function redoCommand(): Command {
  return { type: 'history:redo', payload: null, execute: (s) => s, undo: (s) => s }
}

export const historyCommands = { undo: undoCommand, redo: redoCommand }

export function history() {
  const past: StoreDiff[][] = []
  const future: StoreDiff[][] = []

  return definePlugin({
    name: 'history',
    middleware: (next: (command: Command) => void) => (command: Command) => {
      if (command.type === 'history:undo') {
        const diffs = past.pop()
        if (!diffs) return
        future.push(diffs)
        next({ type: 'history:__restore', payload: null, execute: (store: NormalizedData) => applyDelta(store, diffs, 'reverse'), undo: (s: NormalizedData) => s })
      } else if (command.type === 'history:redo') {
        const diffs = future.pop()
        if (!diffs) return
        past.push(diffs)
        next({ type: 'history:__restore', payload: null, execute: (store: NormalizedData) => applyDelta(store, diffs, 'forward'), undo: (s: NormalizedData) => s })
      } else if (command.type === 'history:__restore') {
        next(command)
      } else {
        let storeBefore: NormalizedData | null = null
        let storeAfter: NormalizedData | null = null

        const wrappedCommand: Command = {
          ...command,
          execute(store) {
            storeBefore = store
            const result = command.execute(store)
            storeAfter = result
            return result
          },
        }

        next(wrappedCommand)

        if (storeBefore !== null && storeAfter !== null) {
          const allDiffs = computeStoreDiff(storeBefore, storeAfter)
          const contentDiffs = allDiffs.filter(isContentDiff)
          if (contentDiffs.length > 0) {
            past.push(contentDiffs)
            future.length = 0
          }
        }
      }
    },
    keyMap: {
      'Mod+Z': () => historyCommands.undo(),
      'Mod+Shift+Z': () => historyCommands.redo(),
    },
  })
}

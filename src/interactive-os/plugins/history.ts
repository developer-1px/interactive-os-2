// ② 2026-03-29-engine-handler-registry-prd.md
import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { computeStoreDiff, applyDelta } from '../store/computeStoreDiff'
import type { StoreDiff } from '../store/computeStoreDiff'
import { definePlugin } from './definePlugin'
import { defineCommand } from '../engine/defineCommand'

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
  return { type: 'history:undo' }
}

export function redoCommand(): Command {
  return { type: 'history:redo' }
}

const restoreCommand = defineCommand('history:__restore', {
  create: (diffs: StoreDiff[], direction: 'forward' | 'reverse') => ({ diffs, direction }),
  handler: (store, { diffs, direction }) => applyDelta(store, diffs, direction),
})

export const historyCommands = { undo: undoCommand, redo: redoCommand }

export function history() {
  const past: StoreDiff[][] = []
  const future: StoreDiff[][] = []

  return definePlugin({
    name: 'history',
    commands: {
      __restore: restoreCommand,
    },
    middleware: (next: (command: Command) => void, getStore: () => NormalizedData) => (command: Command) => {
      if (command.type === 'history:undo') {
        const diffs = past.pop()
        if (!diffs) return
        future.push(diffs)
        next(restoreCommand(diffs, 'reverse'))
      } else if (command.type === 'history:redo') {
        const diffs = future.pop()
        if (!diffs) return
        past.push(diffs)
        next(restoreCommand(diffs, 'forward'))
      } else if (command.type === 'history:__restore') {
        next(command)
      } else {
        const storeBefore = getStore()
        next(command)
        const storeAfter = getStore()

        if (storeBefore !== storeAfter) {
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

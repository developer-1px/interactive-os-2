import type { Command, Plugin, NormalizedData } from '../core/types'

export function undoCommand(): Command {
  return {
    type: 'history:undo',
    payload: null,
    execute: (s) => s,
    undo: (s) => s,
  }
}

export function redoCommand(): Command {
  return {
    type: 'history:redo',
    payload: null,
    execute: (s) => s,
    undo: (s) => s,
  }
}

export const historyCommands = {
  undo: undoCommand,
  redo: redoCommand,
}

export function history(): Plugin {
  const past: Array<{ command: Command; storeBefore: NormalizedData }> = []
  const future: Array<{ command: Command; storeAfter: NormalizedData }> = []

  return {
    middleware: (next) => (command) => {
      if (command.type === 'history:undo') {
        const entry = past.pop()
        if (!entry) return

        const restoreCommand: Command = {
          type: 'history:__restore',
          payload: null,
          execute: () => entry.storeBefore,
          undo: () => entry.storeBefore,
        }
        future.push({
          command: entry.command,
          storeAfter: entry.command.execute(entry.storeBefore),
        })
        next(restoreCommand)
      } else if (command.type === 'history:redo') {
        const entry = future.pop()
        if (!entry) return

        const restoreCommand: Command = {
          type: 'history:__restore',
          payload: null,
          execute: () => entry.storeAfter,
          undo: () => entry.storeAfter,
        }
        past.push({
          command: entry.command,
          storeBefore: entry.command.undo(entry.storeAfter),
        })
        next(restoreCommand)
      } else if (command.type === 'history:__restore') {
        next(command)
      } else {
        // Normal command — capture storeBefore via wrapped execute
        let storeBefore: NormalizedData | null = null

        const wrappedCommand: Command = {
          ...command,
          execute(store) {
            storeBefore = store
            return command.execute(store)
          },
        }

        next(wrappedCommand)

        if (storeBefore !== null) {
          past.push({ command, storeBefore })
          future.length = 0
        }
      }
    },
    keyMap: {
      'Mod+Z': () => historyCommands.undo(),
      'Mod+Shift+Z': () => historyCommands.redo(),
    },
  }
}

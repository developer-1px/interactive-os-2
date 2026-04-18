var e=`import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'
import { definePlugin } from './definePlugin'
import { defineCommand } from '../engine/defineCommand'
import { key } from '../axis/types'

const MAX_STACK = 50

const navigateCommand = defineCommand('focusHistory:__navigate', {
  meta: true,
  create: (nodeId: string) => ({ nodeId }),
  handler: (store, { nodeId }) => ({
    ...store,
    entities: {
      ...store.entities,
      __focus__: { id: '__focus__', focusedId: nodeId },
    },
  }),
})

export function focusBackCommand(): Command {
  return { type: 'focusHistory:back' }
}

export function focusForwardCommand(): Command {
  return { type: 'focusHistory:forward' }
}

export const focusHistoryCommands = { back: focusBackCommand, forward: focusForwardCommand }

export function focusHistory() {
  const past: string[] = []
  const future: string[] = []

  return definePlugin({
    name: 'focusHistory',
    inspect: () => ({ pastCount: past.length, futureCount: future.length }),
    commands: {
      __navigate: navigateCommand,
    },
    middleware: (next: (command: Command) => void, getStore: () => NormalizedData) => (command: Command) => {
      if (command.type === 'focusHistory:back') {
        const target = past.pop()
        if (!target) return
        const current = (getStore().entities['__focus__'] as { focusedId?: string } | undefined)?.focusedId
        if (current) future.push(current)
        next(navigateCommand(target))
      } else if (command.type === 'focusHistory:forward') {
        const target = future.pop()
        if (!target) return
        const current = (getStore().entities['__focus__'] as { focusedId?: string } | undefined)?.focusedId
        if (current) past.push(current)
        next(navigateCommand(target))
      } else if (command.type.startsWith('focusHistory:')) {
        next(command)
      } else {
        const oldFocus = (getStore().entities['__focus__'] as { focusedId?: string } | undefined)?.focusedId

        next(command)

        const newFocus = (getStore().entities['__focus__'] as { focusedId?: string } | undefined)?.focusedId

        if (newFocus && newFocus !== oldFocus) {
          if (oldFocus && past[past.length - 1] !== oldFocus) {
            past.push(oldFocus)
            if (past.length > MAX_STACK) past.shift()
          }
          future.length = 0
        }
      }
    },
    keyMap: {
      'Alt+ArrowLeft': key(['focusHistory:back'], () => focusHistoryCommands.back()),
      'Alt+ArrowRight': key(['focusHistory:forward'], () => focusHistoryCommands.forward()),
    },
  })
}
`;export{e as default};
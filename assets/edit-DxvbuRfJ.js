var e=`import { key, type KeyHandler } from '../axis/types'
import type { Plugin } from './types'
import { definePlugin } from './definePlugin'
import { crudCommands } from './crud'
import { renameCommands, RENAME_ID } from './rename'
import { dndCommands } from '../plugins/dnd'
import { isPrintableKey } from '../plugins/typeahead'
import type { CommandEngine } from '../engine/createCommandEngine'
import { FOCUS_ID } from '../core'

interface EditOptions {
  /** Add Alt+Left/Right for tree indent/outdent */
  tree?: boolean
}

export function edit(options?: EditOptions): Plugin {
  const keyMap: Record<string, KeyHandler> = {
    'F2': key(['rename:start'], (ctx) => renameCommands.startRename(ctx.focused)),
    'Enter': key(['rename:start'], (ctx) => renameCommands.startRename(ctx.focused)),
    'Delete': key(['crud:delete'], (ctx) => crudCommands.remove(ctx.focused)),
    'Alt+ArrowUp': key(['dnd:move-up'], (ctx) => dndCommands.moveUp(ctx.focused)),
    'Alt+ArrowDown': key(['dnd:move-down'], (ctx) => dndCommands.moveDown(ctx.focused)),
  }

  if (options?.tree) {
    keyMap['Alt+ArrowLeft'] = key(['dnd:move-out'], (ctx) => dndCommands.moveOut(ctx.focused))
    keyMap['Alt+ArrowRight'] = key(['dnd:move-in'], (ctx) => dndCommands.moveIn(ctx.focused))
  }

  return definePlugin({ name: 'edit', keyMap })
}

/** Printable-key -> replace-mode rename plugin. Add to plugins array when editing is enabled. */
export function replaceEditPlugin(): Plugin {
  return {
    onUnhandledKey(event: KeyboardEvent, engine: CommandEngine): boolean {
      if (!isPrintableKey(event)) return false
      const store = engine.getStore()
      if (store.entities[RENAME_ID]?.active) return false
      const focusedId = (store.entities[FOCUS_ID]?.focusedId as string) ?? ''
      if (!focusedId) return false
      engine.dispatch(renameCommands.startRename(focusedId, { replace: true, initialChar: event.key }))
      return true
    },
  }
}
`;export{e as default};
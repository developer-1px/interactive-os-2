import type { StructuredAxis } from './composePattern'
import type { Plugin } from '../plugins/types'
import { crudCommands } from '../plugins/crud'
import { renameCommands, RENAME_ID } from '../plugins/rename'
import { dndCommands } from '../plugins/dnd'
import { isPrintableKey } from '../plugins/typeahead'
import type { CommandEngine } from '../engine/createCommandEngine'
import { FOCUS_ID } from '../plugins/core'

interface EditOptions {
  /** Add Alt+Left/Right for tree indent/outdent */
  tree?: boolean
}

export function edit(options?: EditOptions): StructuredAxis {
  const keyMap: StructuredAxis['keyMap'] = {
    'F2': (ctx) => renameCommands.startRename(ctx.focused),
    'Enter': (ctx) => renameCommands.startRename(ctx.focused),
    'Delete': (ctx) => crudCommands.remove(ctx.focused),
    'Alt+ArrowUp': (ctx) => dndCommands.moveUp(ctx.focused),
    'Alt+ArrowDown': (ctx) => dndCommands.moveDown(ctx.focused),
  }

  if (options?.tree) {
    keyMap['Alt+ArrowLeft'] = (ctx) => dndCommands.moveOut(ctx.focused)
    keyMap['Alt+ArrowRight'] = (ctx) => dndCommands.moveIn(ctx.focused)
  }

  return { keyMap }
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

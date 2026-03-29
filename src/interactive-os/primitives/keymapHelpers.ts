import type { Command } from '../engine/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import type { createPatternContext } from '../pattern/createPatternContext'

export function isEditableElement(el: Element): boolean {
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true
  if (el.getAttribute('contenteditable') != null) return true
  return false
}

/** Dispatch a keyMap handler. Returns true if the handler produced a command. */
export function dispatchKeyAction(
  ctx: ReturnType<typeof createPatternContext>,
  handler: (ctx: ReturnType<typeof createPatternContext>) => Command | void,
  engine: CommandEngine,
): boolean {
  const command = handler(ctx)
  if (command) {
    engine.dispatch(command)
    return true
  }
  return false
}

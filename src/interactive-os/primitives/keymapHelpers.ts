import type { Command } from '../engine/types'
import type { CommandEngine } from '../engine/createCommandEngine'
import type { createPatternContext } from '../pattern/createPatternContext'

export function isEditableElement(el: Element): boolean {
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true
  if (el.getAttribute('contenteditable') != null) return true
  return false
}

/** Dispatch a keyMap handler, intercepting activate() when onActivate is provided.
 *  Returns true if the handler produced a command or triggered onActivate. */
export function dispatchKeyAction(
  ctx: ReturnType<typeof createPatternContext>,
  handler: (ctx: ReturnType<typeof createPatternContext>) => Command | void,
  engine: CommandEngine,
  onActivateFn: ((nodeId: string) => void) | undefined,
): boolean {
  if (onActivateFn) {
    let intercepted = false
    ctx.activate = () => {
      intercepted = true
      onActivateFn(ctx.focused)
      return undefined as unknown as Command
    }
    const command = handler(ctx)
    if (!intercepted && command) engine.dispatch(command)
    return intercepted || !!command
  } else {
    const command = handler(ctx)
    if (command) engine.dispatch(command)
    return !!command
  }
}

import type { Command } from '../core/types'
import type { CommandEngine } from '../core/createCommandEngine'
import type { createBehaviorContext } from '../behaviors/createBehaviorContext'

export function isEditableElement(el: Element): boolean {
  const tag = el.tagName
  if (tag === 'INPUT' || tag === 'TEXTAREA') return true
  if (el.getAttribute('contenteditable') != null) return true
  return false
}

/** Dispatch a keyMap handler, intercepting activate() when onActivate is provided. */
export function dispatchKeyAction(
  ctx: ReturnType<typeof createBehaviorContext>,
  handler: (ctx: ReturnType<typeof createBehaviorContext>) => Command | void,
  engine: CommandEngine,
  onActivateFn: ((nodeId: string) => void) | undefined,
) {
  if (onActivateFn) {
    let intercepted = false
    ctx.activate = () => {
      intercepted = true
      onActivateFn(ctx.focused)
      return undefined as unknown as Command
    }
    const command = handler(ctx)
    if (!intercepted && command) engine.dispatch(command)
  } else {
    const command = handler(ctx)
    if (command) engine.dispatch(command)
  }
}

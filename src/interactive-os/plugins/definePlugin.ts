import type { Command, Middleware, VisibilityFilter, Plugin } from './types'
import type { NormalizedData } from '../store/types'

export interface PluginConfig {
  name: string
  visibilityFilter?: VisibilityFilter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commands?: Record<string, (...args: any[]) => any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyMap?: Record<string, (ctx: any) => any>
  middleware?: Middleware
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUnhandledKey?: (event: KeyboardEvent, engine: any) => boolean
  intercepts?: readonly string[]
  requires?: Plugin[]
  /** Native clipboard event handlers — dispatch commands on copy/cut/paste events */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCopy?: (ctx: any) => Command | void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCut?: (ctx: any) => Command | void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPaste?: (ctx: any) => Command | void
}

function composeMiddlewares(middlewares: Middleware[]): Middleware {
  if (middlewares.length === 1) return middlewares[0]!
  return (next: (command: Command) => void, getStore: () => NormalizedData) => middlewares.reduceRight(
    (acc, mw) => mw(acc, getStore),
    next,
  )
}

export function definePlugin(config: PluginConfig): Plugin {
  const { name, commands, keyMap, middleware, onUnhandledKey, intercepts, requires, onCopy, onCut, onPaste, visibilityFilter } = config

  const middlewares: Middleware[] = []
  for (const dep of requires ?? []) {
    if (dep.middleware) middlewares.push(dep.middleware)
  }
  if (middleware) middlewares.push(middleware)

  return {
    name,
    commands,
    keyMap,
    middleware: middlewares.length > 0 ? composeMiddlewares(middlewares) : undefined,
    onUnhandledKey,
    intercepts,
    onCopy,
    onCut,
    onPaste,
    visibilityFilter,
  }
}

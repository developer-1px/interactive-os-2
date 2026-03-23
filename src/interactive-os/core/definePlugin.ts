import type { Middleware, Plugin } from './types'

export interface PluginConfig {
  name: string
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commands?: Record<string, (...args: any[]) => any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyMap?: Record<string, (ctx: any) => any>
  middleware?: Middleware
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUnhandledKey?: (event: KeyboardEvent, engine: any) => boolean
  intercepts?: readonly string[]
  requires?: Plugin[]
}

function composeMiddlewares(middlewares: Middleware[]): Middleware {
  if (middlewares.length === 1) return middlewares[0]!
  return (next) => middlewares.reduceRight(
    (acc, mw) => mw(acc),
    next,
  )
}

export function definePlugin(config: PluginConfig): Plugin {
  const { name, commands, keyMap, middleware, onUnhandledKey, intercepts, requires } = config

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
  }
}

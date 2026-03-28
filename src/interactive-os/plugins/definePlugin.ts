import type { Command, Middleware, Plugin } from './types'

function composeMiddlewares(middlewares: Middleware[]): Middleware {
  if (middlewares.length === 1) return middlewares[0]!
  return (next: (command: Command) => void) => middlewares.reduceRight(
    (acc, mw) => mw(acc),
    next,
  )
}

export function definePlugin(config: Plugin): Plugin {
  const { requires, middleware, ...rest } = config

  const middlewares: Middleware[] = []
  for (const dep of requires ?? []) {
    if (dep.middleware) middlewares.push(dep.middleware)
  }
  if (middleware) middlewares.push(middleware)

  return {
    ...rest,
    middleware: middlewares.length > 0 ? composeMiddlewares(middlewares) : undefined,
  }
}

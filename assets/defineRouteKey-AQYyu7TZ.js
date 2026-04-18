var e=`import type { Command } from '../engine/types'

/** Route key handler — may have static .type for inspector */
export type RouteKeyHandler = (() => Command | void) & { type: string; owner?: string }

export type RouteKeyMap = Record<string, RouteKeyHandler>

/** Create a route key handler with static command metadata for inspector */
export function defineRouteKey(
  commandType: string,
  handler: () => void,
  owner?: string,
): RouteKeyHandler {
  const fn = (() => { handler(); return { type: commandType } as Command }) as RouteKeyHandler
  fn.type = commandType
  fn.owner = owner
  return fn
}
`;export{e as default};
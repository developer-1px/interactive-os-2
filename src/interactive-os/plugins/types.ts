// ② 2026-03-24-isomorphic-layer-tree-prd.md
import type { Command } from '../engine/types'
import type { Middleware, VisibilityFilter } from '../engine/types'

export type { Command, Middleware, VisibilityFilter }

export interface Plugin {
  name?: string
  middleware?: Middleware
  visibilityFilter?: VisibilityFilter
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  commands?: Record<string, (...args: any[]) => Command>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  keyMap?: Record<string, (ctx: any) => Command | void>
  /** Fallback handler for keyboard events not matched by keyMap.
   *  Receives the raw KeyboardEvent. Return true to preventDefault. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onUnhandledKey?: (event: KeyboardEvent, engine: any) => boolean
  intercepts?: readonly string[]
  /** Native clipboard event handlers — dispatch commands on copy/cut/paste events */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCopy?: (ctx: any) => Command | void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onCut?: (ctx: any) => Command | void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onPaste?: (ctx: any) => Command | void
}

// ② 2026-03-29-engine-handler-registry-prd.md
import type { NormalizedData } from '../store/types'
import type { Command } from './types'

// ── defineCommand ──────────────────────────────────────

/** With create (args → payload) */
export function defineCommand<T extends string, A extends unknown[], P>(
  type: T,
  config: {
    meta?: boolean
    create: (...args: A) => P
    handler: (store: NormalizedData, payload: P) => NormalizedData
  },
): ((...args: A) => Command) & {
  readonly type: T
  readonly handler: (store: NormalizedData, payload: P) => NormalizedData
  readonly reduce: (store: NormalizedData, ...args: A) => NormalizedData
}

/** Without create (no args) */
export function defineCommand<T extends string>(
  type: T,
  config: {
    meta?: boolean
    handler: (store: NormalizedData) => NormalizedData
  },
): (() => Command) & {
  readonly type: T
  readonly handler: (store: NormalizedData) => NormalizedData
  readonly reduce: (store: NormalizedData) => NormalizedData
}

/** Implementation */
export function defineCommand(
  type: string,
  config: {
    meta?: boolean
    create?: (...args: unknown[]) => unknown
    handler: (store: NormalizedData, payload?: unknown) => NormalizedData
  },
) {
  const { meta, create, handler } = config

  const creator = (...args: unknown[]) => {
    const payload = create ? create(...args) : undefined
    return {
      type,
      payload,
      meta,
    } as Command
  }

  creator.type = type
  creator.handler = handler
  creator.reduce = (store: NormalizedData, ...args: unknown[]) => {
    const payload = create ? create(...args) : undefined
    return create ? handler(store, payload) : (handler as (s: NormalizedData) => NormalizedData)(store)
  }

  return creator
}

// ── defineCommands ─────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type CommandDef = {
  type: string
  meta?: boolean
  create?: (...args: any[]) => any
  handler: (...args: any[]) => NormalizedData
}

type InferCreator<D> = D extends { create: (...args: infer A) => infer P }
  ? ((...args: A) => Command) & {
      readonly type: string
      readonly handler: (store: NormalizedData, payload: P) => NormalizedData
      readonly reduce: (store: NormalizedData, ...args: A) => NormalizedData
    }
  : (() => Command) & {
      readonly type: string
      readonly handler: (store: NormalizedData) => NormalizedData
      readonly reduce: (store: NormalizedData) => NormalizedData
    }

export function defineCommands<D extends Record<string, CommandDef>>(
  defs: D,
): { [K in keyof D]: InferCreator<D[K]> } {
  const result: Record<string, unknown> = {}
  for (const [key, def] of Object.entries(defs)) {
    result[key] = defineCommand(def.type as never, def as never)
  }
  return result as { [K in keyof D]: InferCreator<D[K]> }
}

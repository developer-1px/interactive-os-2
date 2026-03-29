// ② 2026-03-29-engine-handler-registry-prd.md
import type { Command, Middleware, BatchCommand, CommandHandler, CommandEngine, EngineOptions } from './types'
import { isBatchCommand } from './types'
export type { CommandEngine } from './types'
import type { NormalizedData } from '../store/types'
import { computeStoreDiff } from '../store/computeStoreDiff'
import type { LogEntry, Logger } from './logger'
import { defaultLogger } from './logger'

export function createCommandEngine(
  initialStore: NormalizedData,
  middlewares: Middleware[],
  registry: Map<string, CommandHandler>,
  onStoreChange: (store: NormalizedData) => void,
  options?: EngineOptions
): CommandEngine {
  let store = initialStore

  // --- resolve logger ---
  const resolveLogger = (): Logger | null => {
    if (options?.logger === false) return null
    if (typeof options?.logger === 'function') return options.logger
    // logger: true or undefined → DEV only
    if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
      return defaultLogger
    }
    return null
  }
  const logger = resolveLogger()
  let seq = 0

  const logCommand = (
    command: Command,
    prev: NormalizedData,
    next: NormalizedData,
    parentSeq?: number,
    error?: string
  ) => {
    if (!logger) return
    seq++
    const entry: LogEntry = {
      seq,
      type: command.type,
      payload: command.payload,
      diff: error ? [] : computeStoreDiff(prev, next),
      ...(parentSeq != null ? { parent: parentSeq } : {}),
      ...(error ? { error } : {}),
    }
    logger(entry)

    // batch children: type/payload only, no re-execution
    if (!error && isBatchCommand(command)) {
      const topParentSeq = entry.seq
      const logChildren = (batch: BatchCommand) => {
        for (const child of batch.commands) {
          seq++
          logger({
            seq,
            type: child.type,
            payload: child.payload,
            diff: [],
            parent: topParentSeq,
          })
          // recurse for nested batch
          if (isBatchCommand(child)) {
            logChildren(child as BatchCommand)
          }
        }
      }
      logChildren(command as BatchCommand)
    }
  }

  /** Resolve a command (or batch) into the next store — pure, no closure mutation */
  const resolve = (s: NormalizedData, command: Command): NormalizedData => {
    if (isBatchCommand(command)) {
      for (const sub of (command as BatchCommand).commands) {
        s = resolve(s, sub)
      }
      return s
    }
    const handler = registry.get(command.type)
    if (!handler) {
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn(`[engine] No handler registered for command type "${command.type}"`)
      }
      return s
    }
    return handler(s, command.payload)
  }

  const executor = (command: Command) => {
    const prev = store
    try {
      store = resolve(prev, command)
    } catch (error) {
      store = prev
      logCommand(command, prev, prev, undefined, error instanceof Error ? error.message : String(error))
      return
    }
    logCommand(command, prev, store)
    if (store !== prev) {
      onStoreChange(store)
    }
  }

  const getStore = () => store

  const chain = middlewares.reduceRight<(command: Command) => void>(
    (next, mw) => mw(next, getStore),
    executor
  )

  return {
    dispatch: (command) => chain(command),
    getStore,
    syncStore: (newStore: NormalizedData) => {
      // Silently replace internal store — no onStoreChange callback
      // This is for external data sync, not internal mutations
      store = newStore
    },
  }
}

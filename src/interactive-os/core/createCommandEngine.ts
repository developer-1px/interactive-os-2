import type { Command, Middleware, NormalizedData, BatchCommand } from './types'
import { computeStoreDiff } from './computeStoreDiff'
import type { LogEntry, Logger, EngineOptions } from './dispatchLogger'
import { defaultLogger, isBatchCommand } from './dispatchLogger'

export interface CommandEngine {
  dispatch(command: Command): void
  getStore(): NormalizedData
  /** Replace internal store with external data (for controlled/sync scenarios) */
  syncStore(newStore: NormalizedData): void
}

export function createCommandEngine(
  initialStore: NormalizedData,
  middlewares: Middleware[],
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

  const executor = (command: Command) => {
    const prev = store
    try {
      store = command.execute(store)
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

  const chain = middlewares.reduceRight<(command: Command) => void>(
    (next, mw) => mw(next),
    executor
  )

  return {
    dispatch: (command) => chain(command),
    getStore: () => store,
    syncStore: (newStore: NormalizedData) => {
      // Silently replace internal store — no onStoreChange callback
      // This is for external data sync, not internal mutations
      store = newStore
    },
  }
}

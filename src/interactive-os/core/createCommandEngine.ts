import type { Command, Middleware, NormalizedData } from './types'

export interface CommandEngine {
  dispatch(command: Command): void
  getStore(): NormalizedData
  /** Replace internal store with external data (for controlled/sync scenarios) */
  syncStore(newStore: NormalizedData): void
}

export function createCommandEngine(
  initialStore: NormalizedData,
  middlewares: Middleware[],
  onStoreChange: (store: NormalizedData) => void
): CommandEngine {
  let store = initialStore

  const executor = (command: Command) => {
    const prev = store
    try {
      store = command.execute(store)
    } catch (error) {
      store = prev
      if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
        console.warn(`Command "${command.type}" failed:`, error)
      }
      return
    }
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

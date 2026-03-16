import type { Command, Middleware, NormalizedData } from './types'

export interface CommandEngine {
  dispatch(command: Command): void
  getStore(): NormalizedData
}

export function createCommandEngine(
  initialStore: NormalizedData,
  middlewares: Middleware[],
  onStoreChange: (store: NormalizedData) => void
): CommandEngine {
  let store = initialStore

  const executor = (command: Command) => {
    store = command.execute(store)
    onStoreChange(store)
  }

  const chain = middlewares.reduceRight<(command: Command) => void>(
    (next, mw) => mw(next),
    executor
  )

  return {
    dispatch: (command) => chain(command),
    getStore: () => store,
  }
}

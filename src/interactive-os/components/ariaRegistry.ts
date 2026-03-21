import type { Command, NormalizedData } from '../core/types'

export interface AriaActions {
  dispatch: (command: Command) => void
  getStore: () => NormalizedData
}

const registry = new Map<string, AriaActions>()

export function registerAria(id: string, actions: AriaActions): void {
  registry.set(id, actions)
}

export function unregisterAria(id: string): void {
  registry.delete(id)
}

export function getAriaActions(id: string): AriaActions | undefined {
  return registry.get(id)
}

/** Reset registry — use in tests to isolate state between cases */
export function resetAriaRegistry(): void {
  registry.clear()
}

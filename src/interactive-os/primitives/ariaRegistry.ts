import type { Command } from '../engine/types'
import type { NormalizedData } from '../store/types'

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

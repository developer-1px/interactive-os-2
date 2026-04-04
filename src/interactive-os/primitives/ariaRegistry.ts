import type { Command, InspectResult } from '../engine/types'
import type { NormalizedData } from '../store/types'

// ② 2026-04-04-inspector-zone-keymap-prd.md
export interface AriaActions {
  dispatch: (command: Command) => void
  getStore: () => NormalizedData
  inspect: () => InspectResult
  /** View-level merged keyMap (pattern + plugin + override) — key → owner string */
  getKeyMap?: () => Record<string, string>
  /** Parent registry key for hierarchy display */
  parentId?: string
}

const registry = new Map<string, AriaActions>()

export function registerAria(id: string, actions: AriaActions): void {
  registry.set(id, actions)
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    ((window as unknown as Record<string, unknown>).__ARIA_ENGINES__ as Map<string, AriaActions>).set(id, actions)
  }
}

export function unregisterAria(id: string): void {
  registry.delete(id)
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    ((window as unknown as Record<string, unknown>).__ARIA_ENGINES__ as Map<string, AriaActions>).delete(id)
  }
}

export function getAriaActions(id: string): AriaActions | undefined {
  return registry.get(id)
}

export function getAllAriaActions(): Map<string, AriaActions> {
  return registry
}

// DEV: expose registry on window for console/LLM access
if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
  (window as unknown as Record<string, unknown>).__ARIA_ENGINES__ = registry
}

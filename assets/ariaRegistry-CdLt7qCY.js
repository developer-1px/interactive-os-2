var e=`import type { Command, InspectResult, EngineEvent, Unsubscribe } from '../engine/types'
import type { NormalizedData } from '../store/types'

export interface AriaActions {
  dispatch: (command: Command) => void
  getStore: () => NormalizedData
  inspect: () => InspectResult
  getElement: () => HTMLElement | null
  getNodeElement?: (nodeId: string) => HTMLElement | null
  subscribe: (listener: (event: EngineEvent) => void) => Unsubscribe
}

const registry = new Map<string, AriaActions>()
const registryListeners = new Set<() => void>()

export function registerAria(id: string, actions: AriaActions): void {
  registry.set(id, actions)
  registryListeners.forEach(fn => fn())
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    ((window as unknown as Record<string, unknown>).__ARIA_ENGINES__ as Map<string, AriaActions>).set(id, actions)
  }
}

export function unregisterAria(id: string): void {
  registry.delete(id)
  registryListeners.forEach(fn => fn())
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    ((window as unknown as Record<string, unknown>).__ARIA_ENGINES__ as Map<string, AriaActions>).delete(id)
  }
}

/** Registry 변경 구독 — 엔진 등록/해제 시 호출 */
export function subscribeRegistry(listener: () => void): () => void {
  registryListeners.add(listener)
  return () => { registryListeners.delete(listener) }
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
`;export{e as default};
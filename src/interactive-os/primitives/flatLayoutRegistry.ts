// ② inspectorDefinePagePanelPrd.md
import type { NormalizedData } from '../store/types'
import type { Command } from '../engine/types'

export interface FlatLayoutActions {
  /** 현재 store 스냅샷 — subscribe로 갱신 알림 */
  getStore: () => NormalizedData
  /** 레이아웃 mutate 진입점 — layoutCommands 전용 */
  dispatch: (command: Command) => void
  /** DOM lookup (focusDir·flashPane 등에서 재사용) */
  getNodeElement: (nodeId: string) => HTMLElement | null
  /** store 변경 구독 */
  subscribe: (listener: () => void) => () => void
}

const registry = new Map<string, FlatLayoutActions>()
const registryListeners = new Set<() => void>()

/** Frozen snapshot — useSyncExternalStore의 Object.is 비교용. emit 시마다 새 Map으로 교체. */
let snapshot: Map<string, FlatLayoutActions> = new Map()

function refreshSnapshot(): void {
  snapshot = new Map(registry)
}

function emit(): void {
  refreshSnapshot()
  registryListeners.forEach(fn => fn())
}

/** @invariant id는 FlatLayout 인스턴스당 1회만 등록; 중복 id는 덮어씀 */
export function registerFlatLayout(id: string, actions: FlatLayoutActions): void {
  registry.set(id, actions)
  emit()
  if (typeof import.meta !== 'undefined' && import.meta.env?.DEV) {
    const win = window as unknown as Record<string, unknown>
    if (!win.__FLAT_LAYOUTS__) win.__FLAT_LAYOUTS__ = registry
  }
}

export function unregisterFlatLayout(id: string): void {
  registry.delete(id)
  emit()
}

export function getFlatLayoutActions(id: string): FlatLayoutActions | undefined {
  return registry.get(id)
}

/**
 * @invariant 반환 Map은 변경 전까지 안정적 참조 — useSyncExternalStore getSnapshot으로 바로 사용 가능.
 * register/unregister 시 새 Map으로 교체되어 Object.is 비교가 diff를 감지한다.
 */
export function getAllFlatLayouts(): Map<string, FlatLayoutActions> {
  return snapshot
}

/** registry 엔트리 추가/삭제 시 호출됨 (개별 store 변경 아님) */
export function subscribeFlatLayoutRegistry(listener: () => void): () => void {
  registryListeners.add(listener)
  return () => { registryListeners.delete(listener) }
}

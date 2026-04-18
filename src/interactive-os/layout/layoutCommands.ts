// ② flat-layout-engine-prd.md
// ② cmux-layout-prd.md
import type { NormalizedData } from '../store/types'
import type { Command } from '../engine/types'
import type { TabGroupData } from '../plugins/workspaceStore'
import { defineCommands } from '../engine/defineCommand'
import { getEntityData, updateEntityData } from '../store/createStore'
import { workspaceCommands } from '../plugins/workspaceStore'
import { findBestInDirection } from '../primitives/spatialAlgorithm'
import type { Direction } from '../primitives/spatialAlgorithm'

// ── Focus state ────────────────────────────────────────

/** Focus state entity id — FlatLayout store에서 포커스된 tabgroup/tab을 추적하는 단일 state 노드. */
export const FOCUS_STATE_ID = '__focus' as const

/** 포커스 state 노드 데이터. FlatLayout StateNode의 확장. */
export interface FocusStateData extends Record<string, unknown> {
  type: 'state'
  focusedTabgroupId: string
  focusedTabId?: string
}

// ── Direction mapping ──────────────────────────────────

export type FocusDir = 'left' | 'right' | 'up' | 'down'

/** PRD 도메인 방향 ↔ spatialAlgorithm `Direction` 매핑. */
const ARROW_BY_DIR: Record<FocusDir, Direction> = {
  left: 'ArrowLeft',
  right: 'ArrowRight',
  up: 'ArrowUp',
  down: 'ArrowDown',
}

// ── Commands (순수 store 변환) ─────────────────────────

export const layoutCommands = defineCommands({
  setVisibility: {
    type: 'layout:setVisibility' as const,
    create: (nodeId: string, visible: boolean) => ({ nodeId, visible }),
    handler: (store, { nodeId, visible }) => updateEntityData(store, nodeId, { visible }),
  },
  setHidden: {
    type: 'layout:setHidden' as const,
    create: (nodeId: string, hidden: boolean) => ({ nodeId, hidden }),
    handler: (store, { nodeId, hidden }) => updateEntityData(store, nodeId, { hidden }),
  },
  setGap: {
    type: 'layout:setGap' as const,
    create: (nodeId: string, gap: string) => ({ nodeId, gap }),
    handler: (store, { nodeId, gap }) => updateEntityData(store, nodeId, { gap }),
  },
  setFocus: {
    type: 'layout:setFocus' as const,
    create: (nodeId: string, tabId?: string) => ({ nodeId, tabId }),
    handler: (store, { nodeId, tabId }) =>
      updateEntityData(store, FOCUS_STATE_ID, { focusedTabgroupId: nodeId, focusedTabId: tabId }),
  },

  /**
   * splitHere — focused tabgroup을 direction 방향으로 split.
   * FOCUS_STATE_ID에 focus가 없으면 no-op.
   * workspaceCommands.splitPane의 순수 handler를 호출하여 store만 변환.
   */
  splitHere: {
    type: 'layout:splitHere' as const,
    create: (direction: 'horizontal' | 'vertical') => ({ direction }),
    handler: (store, { direction }) => {
      const focus = getEntityData<FocusStateData>(store, FOCUS_STATE_ID)
      if (!focus?.focusedTabgroupId) return store
      return workspaceCommands.splitPane.handler(store, {
        paneId: focus.focusedTabgroupId,
        direction,
      })
    },
  },

  /**
   * closeHere — focused tabgroup의 active tab을 제거.
   * 마지막 탭이면 workspaceCommands.removeTab 내부에서 auto-collapse.
   */
  closeHere: {
    type: 'layout:closeHere' as const,
    create: () => ({}),
    handler: (store) => {
      const focus = getEntityData<FocusStateData>(store, FOCUS_STATE_ID)
      if (!focus?.focusedTabgroupId) return store
      const tg = getEntityData<TabGroupData>(store, focus.focusedTabgroupId)
      const activeTabId = tg?.activeTabId
      if (!activeTabId) return store
      return workspaceCommands.removeTab.handler(store, { tabId: activeTabId })
    },
  },

  /**
   * focusDir (pure) — pre-computed winner id를 받아 focus state만 갱신.
   * DOM rect 수집·비교는 호출자(keymap)가 `computeFocusDirTarget`로 pre-compute해서 payload로 넘긴다.
   * command handler는 순수 유지 (엔진 규약: command = pure store transform).
   */
  focusDir: {
    type: 'layout:focusDir' as const,
    create: (nodeId: string) => ({ nodeId }),
    handler: (store, { nodeId }) =>
      updateEntityData(store, FOCUS_STATE_ID, { focusedTabgroupId: nodeId }),
  },

  /**
   * flashPane (pure) — store 변환은 없음.
   * DOM 효과는 `flashPaneEffect` 헬퍼가 담당. 이 command는 dispatch 로그/middleware hook으로만 의미.
   */
  flashPane: {
    type: 'layout:flashPane' as const,
    create: () => ({}),
    handler: (store) => store,
  },
})

// ── Helpers (DOM-aware, command 밖) ────────────────────

/**
 * 현재 focused tabgroup의 DOM rect와 다른 모든 tabgroup rect를 수집,
 * `findBestInDirection`으로 방향상 승자 id를 반환한다.
 * keymap 핸들러가 이 결과를 `layoutCommands.focusDir(winnerId)`로 dispatch.
 */
export function computeFocusDirTarget(
  store: NormalizedData,
  dir: FocusDir,
  getNodeElement: (nodeId: string) => HTMLElement | null,
): string | null {
  const focus = getEntityData<FocusStateData>(store, FOCUS_STATE_ID)
  if (!focus?.focusedTabgroupId) return null

  const currentEl = getNodeElement(focus.focusedTabgroupId)
  if (!currentEl) return null
  const fromRect = currentEl.getBoundingClientRect()

  const candidates: Array<[string, DOMRect]> = []
  for (const [id, entity] of Object.entries(store.entities)) {
    if (id === focus.focusedTabgroupId) continue
    const data = entity.data as { type?: string } | undefined
    if (data?.type !== 'tabgroup') continue
    const el = getNodeElement(id)
    if (!el) continue
    candidates.push([id, el.getBoundingClientRect()])
  }

  return findBestInDirection(fromRect, ARROW_BY_DIR[dir], candidates)
}

/**
 * focusDir 편의 함수 — DOM rect 수집 + command 생성까지 한 번에.
 * winner가 없으면 null 반환. dispatch 여부는 호출자가 결정.
 */
export function focusDirCommand(
  store: NormalizedData,
  dir: FocusDir,
  getNodeElement: (nodeId: string) => HTMLElement | null,
): Command | null {
  const winnerId = computeFocusDirTarget(store, dir, getNodeElement)
  if (!winnerId) return null
  return layoutCommands.focusDir(winnerId)
}

/**
 * flashPane DOM 사이드이펙트 — focused tabgroup의 element에
 * `data-flash="true"`를 1회 토글. 300ms 후 removeAttribute.
 * store 변환 없음 (plugin middleware 또는 keymap에서 직접 호출).
 */
export function flashPaneEffect(
  store: NormalizedData,
  getNodeElement: (nodeId: string) => HTMLElement | null,
): void {
  const focus = getEntityData<FocusStateData>(store, FOCUS_STATE_ID)
  if (!focus?.focusedTabgroupId) return
  const el = getNodeElement(focus.focusedTabgroupId)
  if (!el) return
  el.setAttribute('data-flash', 'true')
  setTimeout(() => el.removeAttribute('data-flash'), 300)
}

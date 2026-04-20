// ② flat-layout-engine-prd.md
// ② cmux-layout-prd.md
import type { NormalizedData, Entity } from '../store/types'
import type { Command } from '../engine/types'
import type { TabData, TabGroupData } from '../plugins/workspaceStore'
import { defineCommands } from '../engine/defineCommand'
import { getEntityData, updateEntityData } from '../store/createStore'
import { workspaceCommands, splitAndAddTab } from '../plugins/workspaceStore'
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
  // ② inspectorDefinePagePanelPrd.md — 범용 노드 patch command
  updateNode: {
    type: 'layout:updateNode' as const,
    create: (nodeId: string, patch: Record<string, unknown>) => ({ nodeId, patch }),
    handler: (store, { nodeId, patch }) => updateEntityData(store, nodeId, patch),
  },
  setFocus: {
    type: 'layout:setFocus' as const,
    create: (nodeId: string, tabId?: string) => ({ nodeId, tabId }),
    handler: (store, { nodeId, tabId }) =>
      updateEntityData(store, FOCUS_STATE_ID, { focusedTabgroupId: nodeId, focusedTabId: tabId }),
  },

  /**
   * splitHere — focused tabgroup을 direction 방향으로 split 하고 새 pane에 탭을 추가한다.
   * seed 미지정: cmux 규약대로 active tab 복제 (contentType/contentRef 동일).
   * seed 지정: 새 pane을 해당 payload로 초기화 (예: playground의 빈 슬롯 분할).
   * FOCUS_STATE_ID에 focus가 없으면 no-op.
   */
  splitHere: {
    type: 'layout:splitHere' as const,
    create: (direction: 'horizontal' | 'vertical', seed?: Partial<Pick<TabData, 'label' | 'contentType' | 'contentRef'>>) => ({ direction, seed }),
    handler: (store, { direction, seed }) => {
      const focus = getEntityData<FocusStateData>(store, FOCUS_STATE_ID)
      if (!focus?.focusedTabgroupId) return store
      const tgId = focus.focusedTabgroupId
      const tg = getEntityData<TabGroupData>(store, tgId)
      const srcTabId = tg?.activeTabId
      const srcTabData = srcTabId ? getEntityData<TabData>(store, srcTabId) : undefined
      // cmux 기본 fill 정책: active tab 복제 > seed > chat(SurfaceLeaf) 기본값.
      // 빈 placeholder 대신 항상 chat 탭을 띄워 "다음 뭐 꽂지" 고민 제거.
      const newId = `t-${Date.now().toString(36)}`
      const newTab: Entity = {
        id: newId,
        data: {
          type: 'tab',
          label:       seed?.label       ?? srcTabData?.label       ?? 'Chat',
          contentType: seed?.contentType ?? srcTabData?.contentType ?? 'chat',
          contentRef:  seed?.contentRef  ?? srcTabData?.contentRef  ?? '',
        } as TabData,
      }
      return splitAndAddTab(store, tgId, direction, newTab)
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

  /**
   * replaceStore — store 전체 교체. playground `layout_init`처럼 캔버스를 통째로 새 구조로
   * 대체할 때 사용. 호출자가 보호 노드(composer/subtitle/__focus 등) 보존 책임을 짐.
   */
  replaceStore: {
    type: 'layout:replaceStore' as const,
    create: (next: NormalizedData) => ({ next }),
    handler: (_store, { next }) => next,
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

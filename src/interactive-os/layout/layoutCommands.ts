// ② flat-layout-engine-prd.md
// ② cmux-layout-prd.md
import { defineCommands } from '../engine/defineCommand'
import { updateEntityData } from '../store/createStore'

// ── Focus state ────────────────────────────────────────

/** Focus state entity id — FlatLayout store에서 포커스된 tabgroup/tab을 추적하는 단일 state 노드. */
export const FOCUS_STATE_ID = '__focus' as const

/** 포커스 state 노드 데이터. FlatLayout StateNode의 확장. */
export interface FocusStateData {
  type: 'state'
  focusedTabgroupId: string
  focusedTabId?: string
}

// ── Commands ───────────────────────────────────────────

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
})

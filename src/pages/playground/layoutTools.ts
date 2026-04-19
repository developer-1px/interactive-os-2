// LLM이 playground의 FlatLayout을 조작하는 tool 집합.
// Phase 1(MVP): a2ui와 동형 text-block 프로토콜.
//   LLM이 ```flatlayout ... ``` 블록을 출력 → 클라이언트 parse → FlatLayoutRegistry dispatch.
// Phase 2(추후): createSdkMcpServer + WS RPC 정식 tool_use로 승격.
// 양 Phase 모두 payload shape { tool, input }는 동일하게 유지.
import type { FlatLayoutActions } from '@os/primitives/flatLayoutRegistry'
import type { NormalizedData, Entity } from '@os/store/types'
import { ROOT_ID } from '@os/store/types'
import { getEntityData, getChildren } from '@os/store/createStore'
import { layoutCommands, FOCUS_STATE_ID, type FocusStateData } from '@os/layout/layoutCommands'
import { workspaceCommands, type TabGroupData, type TabData } from '@os/plugins/workspaceStore'
import { definePage, type LayoutNode } from '@os/layout/flatLayout'
import { PICKER_STATE_ID } from './playgroundDefaults'

/** layout_init 시 사라지면 안 되는 노드들 — floating overlay(composer/subtitle/chatlog) + state 노드. */
const PROTECTED_IDS = new Set<string>([
  'composer-float', 'composer-widget',
  'subtitle-float', 'subtitle-widget',
  'chatlog-float', 'chatlog-widget',
  FOCUS_STATE_ID, PICKER_STATE_ID,
])

// ── Tool payload ──────────────────────────────────────

export interface ToolCall {
  tool: string
  input?: Record<string, unknown>
}

export interface ToolResult {
  ok: boolean
  note?: string
  error?: string
}

// ── Helpers ───────────────────────────────────────────

function focusedTabgroupId(store: NormalizedData): string | null {
  return getEntityData<FocusStateData>(store, FOCUS_STATE_ID)?.focusedTabgroupId ?? null
}

function activeTabId(store: NormalizedData, tgId: string): string | null {
  return getEntityData<TabGroupData>(store, tgId)?.activeTabId ?? null
}

function resolveTabId(store: NormalizedData, input: { tabId?: string }): string | null {
  if (input.tabId) return input.tabId
  const tg = focusedTabgroupId(store)
  return tg ? activeTabId(store, tg) : null
}

function newTabId(): string {
  return `t-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

// ── Tool handlers ─────────────────────────────────────

type ToolHandler = (actions: FlatLayoutActions, input: Record<string, unknown>) => ToolResult

const handlers: Record<string, ToolHandler> = {
  /**
   * 블랭크에서 화면 한방 부팅. 캔버스 subtree를 LLM이 준 entities로 통째로 교체한다.
   * floating overlays(composer/subtitle/chatlog)와 state 노드(__focus/__picker)는
   * PROTECTED_IDS로 보존 — playground UX가 깨지지 않는다.
   */
  layout_init(actions, input) {
    try {
      const entities = input.entities as Record<string, { data: LayoutNode; children?: string[] }>
      if (!entities || typeof entities !== 'object') {
        return { ok: false, error: 'entities object required' }
      }
      const page = definePage({ entities })
      const current = actions.getStore()

      // 1) LLM이 새로 정의한 id와 보호 노드 id가 충돌하면 사용자 입력 방어.
      for (const id of Object.keys(page.entities)) {
        if (PROTECTED_IDS.has(id)) {
          return { ok: false, error: `entity id "${id}" conflicts with reserved overlay/state node` }
        }
      }

      // 2) 보호 노드 entities + slots 복사.
      const nextEntities: NormalizedData['entities'] = { ...page.entities }
      const nextSlots: NormalizedData['slots'] = { ...(page.slots ?? {}) }
      for (const id of PROTECTED_IDS) {
        const e = current.entities[id]
        if (e) nextEntities[id] = e
        const s = current.slots?.[id]
        if (s) nextSlots[id] = s
      }

      // 2-b) Tab 노드에 PlaygroundSurface widget 자식 자동 주입.
      // FlatLayout의 tab renderer는 children이 없으면 null 반환하므로 canvas가 빈다.
      // definePage가 만든 각 tab 엔티티마다 `{tabId}-body` widget 자식을 붙여 surface를 렌더한다.
      const autoChildrenByTab: Record<string, string[]> = {}
      for (const [id, entity] of Object.entries(page.entities)) {
        const data = entity.data as Record<string, unknown> | undefined
        if (data?.type !== 'tab') continue
        const existingChildren = page.relationships[id] ?? []
        if (existingChildren.length > 0) continue
        const bodyId = `${id}-body`
        nextEntities[bodyId] = {
          id: bodyId,
          data: { type: 'widget', widget: 'PlaygroundSurface', label: 'PlaygroundSurface' },
        }
        autoChildrenByTab[id] = [bodyId]
      }

      // 3) relationships.__root__ = canvas top-level + 기존에 top-level이었던 보호 노드만.
      //    (widget 노드는 float의 children이지 top-level이 아님 — 섞지 말 것)
      const canvasTopLevel = page.relationships[ROOT_ID] ?? []
      const currentTopLevel = current.relationships[ROOT_ID] ?? []
      const preservedTopLevel = currentTopLevel.filter(id => PROTECTED_IDS.has(id) && current.entities[id])
      const nextRelationships: NormalizedData['relationships'] = { ...page.relationships, ...autoChildrenByTab }
      nextRelationships[ROOT_ID] = [...canvasTopLevel, ...preservedTopLevel]
      // 보호 노드들의 children 관계 유지 (예: chatlog-float → [chatlog-widget])
      for (const id of PROTECTED_IDS) {
        const rel = current.relationships[id]
        if (rel) nextRelationships[id] = rel
      }

      const next: NormalizedData = { entities: nextEntities, relationships: nextRelationships, slots: nextSlots }
      actions.dispatch(layoutCommands.replaceStore(next))
      return { ok: true, note: `initialized ${Object.keys(entities).length} entities (canvas top-level: ${canvasTopLevel.join(', ')})` }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  },

  /** focused tabgroup을 direction 방향으로 분할 + 빈 슬롯. */
  layout_split(actions, input) {
    const direction = (input.direction as 'horizontal' | 'vertical') ?? 'horizontal'
    const widget = (input.widget as string | undefined) ?? ''
    actions.dispatch(layoutCommands.splitHere(direction, {
      label: widget || 'Untitled', contentType: 'widget', contentRef: widget,
    }))
    return { ok: true, note: `split ${direction}${widget ? ` with ${widget}` : ' (empty)'}` }
  },

  /** focused tabgroup에 새 탭 추가. widget 생략 시 빈 슬롯. */
  layout_add_tab(actions, input) {
    const store = actions.getStore()
    const tgId = (input.tabgroupId as string | undefined) ?? focusedTabgroupId(store)
    if (!tgId) return { ok: false, error: 'no focused tabgroup' }
    const widget = (input.widget as string | undefined) ?? ''
    const tab: Entity = {
      id: newTabId(),
      data: { type: 'tab', label: widget || 'Untitled', contentType: 'widget', contentRef: widget } as TabData,
    }
    actions.dispatch(workspaceCommands.addTab(tgId, tab))
    return { ok: true, note: `added tab ${tab.id}` }
  },

  /** 지정된 탭(또는 focused active)을 닫는다. */
  layout_close_tab(actions, input) {
    const store = actions.getStore()
    const tabId = resolveTabId(store, input as { tabId?: string })
    if (!tabId) return { ok: false, error: 'no tab resolved' }
    actions.dispatch(workspaceCommands.removeTab(tabId))
    return { ok: true, note: `closed ${tabId}` }
  },

  /** 탭의 contentRef(widget 이름)를 교체. 사람의 ⌘K와 동형. */
  layout_set_widget(actions, input) {
    const store = actions.getStore()
    const tabId = resolveTabId(store, input as { tabId?: string })
    if (!tabId) return { ok: false, error: 'no tab resolved' }
    const widget = input.widget as string
    if (!widget) return { ok: false, error: 'widget required' }
    actions.dispatch(layoutCommands.updateNode(tabId, { contentRef: widget, label: widget }))
    return { ok: true, note: `set ${tabId} = ${widget}` }
  },

  /** 범용 patch — data field를 shallow merge. */
  layout_update_node(actions, input) {
    const nodeId = input.nodeId as string
    const patch = input.patch as Record<string, unknown>
    if (!nodeId || !patch) return { ok: false, error: 'nodeId/patch required' }
    actions.dispatch(layoutCommands.updateNode(nodeId, patch))
    return { ok: true, note: `updated ${nodeId}` }
  },

  /** 현재 store 요약 — id, type, children, widget(있으면) 만. */
  layout_read(actions) {
    const store = actions.getStore()
    const summary: Array<{ id: string; type: string; children?: string[]; widget?: string; label?: string }> = []
    for (const [id, entity] of Object.entries(store.entities)) {
      if (id === FOCUS_STATE_ID || id === PICKER_STATE_ID) continue
      const d = entity.data as Record<string, unknown> | undefined
      const type = d?.type as string | undefined
      if (!type) continue
      const children = getChildren(store, id)
      summary.push({
        id, type,
        ...(children.length ? { children } : {}),
        ...(d?.contentRef ? { widget: d.contentRef as string } : {}),
        ...(d?.label ? { label: d.label as string } : {}),
      })
    }
    const focus = getEntityData<FocusStateData>(store, FOCUS_STATE_ID)
    return {
      ok: true,
      note: JSON.stringify({ root: getChildren(store, ROOT_ID), focused: focus?.focusedTabgroupId, nodes: summary }),
    }
  },
}

// ── Dispatch entry ────────────────────────────────────

export function dispatchToolCall(actions: FlatLayoutActions, call: ToolCall): ToolResult {
  const handler = handlers[call.tool]
  if (!handler) return { ok: false, error: `unknown tool: ${call.tool}` }
  return handler(actions, call.input ?? {})
}

export const LAYOUT_TOOL_NAMES = Object.keys(handlers) as readonly string[]

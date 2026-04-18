/**
 * Chat domain commands — all mutations to ChatSession + UI singleton.
 *
 * 각 command 는 NormalizedData → NormalizedData 순수 함수.
 * WS/SDK 측면(send-message, create-session 송신)은 plugin middleware 또는
 * page 레이어에서 dispatch 후 부수효과로 호출.
 *
 * Command families:
 *  - chat:create-session       — 빈 세션 생성 + 활성화
 *  - chat:close-session        — 세션 삭제 (active 였으면 다음 세션으로 이동)
 *  - chat:set-active           — activeSessionId 변경 + lastReadAt = now + unread = 0
 *  - chat:send-message-local   — user 메시지 카운트 +1, state='running'
 *  - chat:receive-message      — assistant 응답 도착, lastUpdatedAt 갱신, unread 증가 (active 아닐 시)
 *  - chat:set-state            — state/activity 만 변경
 *  - chat:set-meta             — cwd/branch/title 패치 (ws session-info 응답 반영)
 *  - chat:interrupt            — running 세션 중단 (state='idle', activity='idle')
 *  - chat:clear-session        — 메시지 비우고 초기화
 *  - chat:set-model            — model 필드 변경
 *  - chat:set-composer-draft   — UI 입력 buffer
 *  - chat:toggle-bottom-panel  — UI bottomVisible 토글
 *  - chat:set-sidebar-mode     — UI sidebarMode 변경
 */
import { defineCommands } from '@os/engine/defineCommand'
import {
  addEntity,
  removeEntity,
  updateEntityData,
  getEntity,
  getChildren,
} from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData, Entity } from '@os/store/types'
import type {
  ChatSessionData,
  ChatUiStateData,
  SessionState,
  SessionActivity,
  SidebarMode,
} from './chatTypes'
import { CHAT_UI_STATE_ID } from './chatTypes'

// ── id helper ────────────────────────────────────────────────

let _idCounter = 0
function nextSessionId(): string {
  _idCounter += 1
  return `session-${_idCounter}-${Date.now().toString(36)}`
}

/** Test-only — reset id counter for deterministic snapshots */
export function resetChatIdCounter(): void {
  _idCounter = 0
}

// ── ChatSession default ──────────────────────────────────────

function defaultSession(id: string, now: number, overrides?: Partial<ChatSessionData>): ChatSessionData {
  return {
    id,
    sdkSessionId: '',
    state: 'idle',
    activity: 'idle',
    messageCount: 0,
    streamingText: '',
    thinkingText: '',
    usage: null,
    cwd: null,
    branch: null,
    title: null,
    createdAt: now,
    lastUpdatedAt: now,
    unreadCount: 0,
    lastReadAt: now,
    model: '',
    commands: [],
    ...overrides,
  }
}

// ── UI state helper ──────────────────────────────────────────

function patchUiState(store: NormalizedData, patch: Partial<ChatUiStateData>): NormalizedData {
  const current = (getEntity(store, CHAT_UI_STATE_ID)?.data ?? {
    type: 'ui',
    activeSessionId: null,
    sidebarMode: 'sessions',
    bottomVisible: false,
    composerDraft: '',
  }) as ChatUiStateData
  return updateEntityData(store, CHAT_UI_STATE_ID, { ...current, ...patch, type: 'ui' })
}

function getActiveId(store: NormalizedData): string | null {
  const ui = getEntity(store, CHAT_UI_STATE_ID)?.data as ChatUiStateData | undefined
  return ui?.activeSessionId ?? null
}

// ── Commands ─────────────────────────────────────────────────

export const chatCommands = defineCommands({
  createSession: {
    type: 'chat:create-session' as const,
    create: (input?: { cwd?: string; branch?: string; now?: number }) => ({
      id: nextSessionId(),
      cwd: input?.cwd ?? null,
      branch: input?.branch ?? null,
      now: input?.now ?? Date.now(),
    }),
    handler: (store, { id, cwd, branch, now }) => {
      const session = defaultSession(id, now, { cwd, branch })
      const entity: Entity = { id, data: session }
      const next = addEntity(store, entity, ROOT_ID)
      return patchUiState(next, { activeSessionId: id })
    },
  },

  closeSession: {
    type: 'chat:close-session' as const,
    create: (id: string) => ({ id }),
    handler: (store, { id }) => {
      const removed = removeEntity(store, id)
      if (getActiveId(store) === id) {
        const remaining = getChildren(removed, ROOT_ID).filter(x => x !== CHAT_UI_STATE_ID)
        const nextActive = remaining[0] ?? null
        return patchUiState(removed, { activeSessionId: nextActive })
      }
      return removed
    },
  },

  setActive: {
    type: 'chat:set-active' as const,
    meta: true,
    create: (id: string, now?: number) => ({ id, now: now ?? Date.now() }),
    handler: (store, { id, now }) => {
      const session = getEntity(store, id)?.data as ChatSessionData | undefined
      let next = patchUiState(store, { activeSessionId: id })
      if (session) {
        next = updateEntityData(next, id, { lastReadAt: now, unreadCount: 0 })
      }
      return next
    },
  },

  sendMessageLocal: {
    type: 'chat:send-message-local' as const,
    create: (id: string, now?: number) => ({ id, now: now ?? Date.now() }),
    handler: (store, { id, now }) => {
      const s = getEntity(store, id)?.data as ChatSessionData | undefined
      if (!s) return store
      return updateEntityData(store, id, {
        state: 'running',
        activity: 'thinking',
        messageCount: s.messageCount + 1,
        lastUpdatedAt: now,
      })
    },
  },

  receiveMessage: {
    type: 'chat:receive-message' as const,
    create: (id: string, now?: number) => ({ id, now: now ?? Date.now() }),
    handler: (store, { id, now }) => {
      const s = getEntity(store, id)?.data as ChatSessionData | undefined
      if (!s) return store
      const isActive = getActiveId(store) === id
      return updateEntityData(store, id, {
        messageCount: s.messageCount + 1,
        lastUpdatedAt: now,
        unreadCount: isActive ? s.unreadCount : s.unreadCount + 1,
      })
    },
  },

  setState: {
    type: 'chat:set-state' as const,
    create: (id: string, state: SessionState, activity?: SessionActivity) => ({ id, state, activity }),
    handler: (store, { id, state, activity }) => {
      const patch: Partial<ChatSessionData> = { state }
      if (activity) patch.activity = activity
      return updateEntityData(store, id, patch)
    },
  },

  setMeta: {
    type: 'chat:set-meta' as const,
    create: (id: string, meta: { cwd?: string | null; branch?: string | null; title?: string | null }) => ({ id, meta }),
    handler: (store, { id, meta }) => updateEntityData(store, id, meta),
  },

  interrupt: {
    type: 'chat:interrupt' as const,
    create: (id: string, now?: number) => ({ id, now: now ?? Date.now() }),
    handler: (store, { id, now }) => updateEntityData(store, id, {
      state: 'idle',
      activity: 'idle',
      streamingText: '',
      thinkingText: '',
      lastUpdatedAt: now,
    }),
  },

  clearSession: {
    type: 'chat:clear-session' as const,
    create: (id: string, now?: number) => ({ id, now: now ?? Date.now() }),
    handler: (store, { id, now }) => {
      const s = getEntity(store, id)?.data as ChatSessionData | undefined
      if (!s) return store
      return updateEntityData(store, id, defaultSession(id, now, {
        sdkSessionId: s.sdkSessionId,
        cwd: s.cwd,
        branch: s.branch,
        title: s.title,
        model: s.model,
      }))
    },
  },

  setModel: {
    type: 'chat:set-model' as const,
    create: (id: string, model: string) => ({ id, model }),
    handler: (store, { id, model }) => updateEntityData(store, id, { model }),
  },

  setComposerDraft: {
    type: 'chat:set-composer-draft' as const,
    meta: true,
    create: (text: string) => ({ text }),
    handler: (store, { text }) => patchUiState(store, { composerDraft: text }),
  },

  toggleBottomPanel: {
    type: 'chat:toggle-bottom-panel' as const,
    meta: true,
    handler: (store) => {
      const ui = getEntity(store, CHAT_UI_STATE_ID)?.data as ChatUiStateData | undefined
      const next = !(ui?.bottomVisible ?? false)
      return patchUiState(store, { bottomVisible: next })
    },
  },

  setSidebarMode: {
    type: 'chat:set-sidebar-mode' as const,
    meta: true,
    create: (mode: SidebarMode) => ({ mode }),
    handler: (store, { mode }) => patchUiState(store, { sidebarMode: mode }),
  },
})

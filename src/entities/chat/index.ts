/**
 * Chat entity barrel — 외부 import는 이 파일을 경유.
 *
 * 사용 예:
 *   import { chatCommands, selectCard, type SessionCardModel } from '@entities/chat'
 */

// Schema (Zod) — runtime validation 필요 시 사용
export {
  chatSessionSchema,
  chatUiStateSchema,
  sessionCardModelSchema,
  sessionStateSchema,
  sessionActivitySchema,
  sessionUiStateSchema,
  sidebarModeSchema,
  turnUsageSchema,
} from './chatSchema'

// Types
export type {
  ChatSessionData,
  ChatUiStateData,
  SessionCardModel,
  TurnUsage,
  SessionState,
  SessionActivity,
  SessionUiState,
  SidebarMode,
} from './chatTypes'
export { CHAT_UI_STATE_ID } from './chatTypes'

// Fixtures
export {
  chatSessionFixtures,
  chatUiStateFixture,
  previewTextFixtures,
} from './chatFixtures'

// Commands + Plugin
export { chatCommands, resetChatIdCounter } from './chatCommands'
export { chatPlugin } from './chatPlugin'

// Domain UI (entities-only renderable)
export { SessionCard } from './ui/SessionCard'

// Selectors
export {
  selectUiState,
  selectActiveSessionId,
  selectSessionIds,
  selectSessions,
  selectSessionsSorted,
  selectUiStateOf,
  selectCard,
  selectTotalUnread,
  formatAgo,
} from './chatSelectors'
export type { CardSelectInput } from './chatSelectors'

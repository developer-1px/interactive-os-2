/**
 * Chat selectors — derive UI-shaped data from ChatSessionData.
 *
 * SessionCard 는 ChatSessionData 를 직접 보지 않고 selectCard() 결과만 사용.
 * 카드의 모든 표시 로직(제목/cwd 폴백, glow 조건, 시간 포맷)이 여기 격리.
 */
import { getChildren, getEntityData } from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import type {
  ChatSessionData,
  SessionCardModel,
  SessionUiState,
  ChatUiStateData,
} from './chatTypes'
import { CHAT_UI_STATE_ID } from './chatTypes'

// ── UI singleton ──────────────────────────────────────────────

export function selectUiState(store: NormalizedData): ChatUiStateData {
  const data = getEntityData<ChatUiStateData>(store, CHAT_UI_STATE_ID)
  return data ?? {
    type: 'ui',
    activeSessionId: null,
    sidebarMode: 'sessions',
    bottomVisible: false,
    composerDraft: '',
  }
}

export function selectActiveSessionId(store: NormalizedData): string | null {
  return selectUiState(store).activeSessionId
}

// ── Sessions list ─────────────────────────────────────────────

export function selectSessionIds(store: NormalizedData): string[] {
  // CHAT_UI_STATE_ID 는 ROOT children 에서 제외 (UI singleton 이지 session 이 아님)
  return getChildren(store, ROOT_ID).filter(id => id !== CHAT_UI_STATE_ID)
}

export function selectSessions(store: NormalizedData): ChatSessionData[] {
  const ids = selectSessionIds(store)
  const result: ChatSessionData[] = []
  for (const id of ids) {
    const data = getEntityData<ChatSessionData>(store, id)
    if (data) result.push(data)
  }
  return result
}

/** lastUpdatedAt 내림차순 정렬 */
export function selectSessionsSorted(store: NormalizedData): ChatSessionData[] {
  return [...selectSessions(store)].sort((a, b) => b.lastUpdatedAt - a.lastUpdatedAt)
}

// ── Single session derive ─────────────────────────────────────

export function selectUiStateOf(s: ChatSessionData, isActive: boolean): SessionUiState {
  if (s.state === 'error') return 'error'
  if (s.state === 'requires_action') return 'waiting'
  if (s.state === 'running') return 'running'
  if (isActive) return 'active'
  return 'idle'
}

const MIN = 60_000
const HOUR = 60 * MIN
const DAY = 24 * HOUR

export function formatAgo(deltaMs: number): string {
  if (deltaMs < MIN) return 'just now'
  if (deltaMs < HOUR) return `${Math.floor(deltaMs / MIN)}m ago`
  if (deltaMs < DAY) return `${Math.floor(deltaMs / HOUR)}h ago`
  return `${Math.floor(deltaMs / DAY)}d ago`
}

export interface CardSelectInput {
  session: ChatSessionData
  isActive: boolean
  previewText: string
  now: number
}

export function selectCard(input: CardSelectInput): SessionCardModel {
  const { session: s, isActive, previewText, now } = input
  const uiState = selectUiStateOf(s, isActive)
  return {
    id: s.id,
    uiState,
    title: s.title ?? s.id.slice(0, 12),
    cwd: s.cwd ?? '(no cwd)',
    branch: s.branch,
    previewText,
    msgCount: s.messageCount,
    unreadCount: isActive ? 0 : s.unreadCount,
    lastUpdatedAgo: formatAgo(Math.max(0, now - s.lastUpdatedAt)),
    hasGlow: uiState === 'waiting' || uiState === 'error',
  }
}

// ── Aggregates ────────────────────────────────────────────────

export function selectTotalUnread(store: NormalizedData): number {
  const activeId = selectActiveSessionId(store)
  let total = 0
  for (const s of selectSessions(store)) {
    if (s.id === activeId) continue
    total += s.unreadCount
  }
  return total
}

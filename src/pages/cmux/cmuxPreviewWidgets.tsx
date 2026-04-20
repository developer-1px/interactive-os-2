/**
 * cmux preview widgets — 오로지 defineLayout 선언만으로 cmux 화면을 뿌리기 위한
 * 정적 presentation widget 모음. widget은 props가 아닌 CmuxPreviewContext에서
 * 값을 pull 한다 (feedback_flatlayout_pull_not_push).
 *
 * 의도적 제약:
 *   - pages/cmux-preview/ 안에 JSX 날코딩 최소화 — 각 widget은 ui/ 완성품 1개 + 데이터 어댑터
 *   - PageCmuxPreview.tsx 는 defineLayout 선언 + <FlatLayout/> 한 번으로 끝난다
 *   - widget 간 값 차이는 Context value만 교체하면 재현 (1 defineLayout → N variant)
 */
import { NavList } from '@os/ui/NavList'
import { Feed } from '@os/ui/Feed'
import { Composer } from '@os/ui/Composer'
import { EmptyState } from '@os/ui/EmptyState'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { createStore, ROOT_ID } from '@os/schema'
import {
  SessionCard,
  selectCard,
  chatSessionFixtures,
  previewTextFixtures,
} from '@entities/chat'
import { useCmuxPreview } from './cmuxPreviewContext'

// ── Fixture 고정 시점 — SessionCard의 "N분 전" 표시가 스샷마다 바뀌지 않도록 시간 앵커 ──
const FIXED_NOW = 1745000000000

// ── 1. WorkspaceList — 좌측 사이드바, fixture 세션 3개 ─────────
function WorkspaceListWidget() {
  const { activeSessionId } = useCmuxPreview()
  const sessions = Object.values(chatSessionFixtures)
  const data = createStore({
    entities: Object.fromEntries(
      sessions.map((s) => [s.id, {
        id: s.id,
        data: {
          card: selectCard({
            session: s,
            isActive: s.id === activeSessionId,
            previewText: previewTextFixtures[s.id] ?? '',
            now: FIXED_NOW,
          }),
        },
      }]),
    ),
    relationships: { [ROOT_ID]: sessions.map((s) => s.id) },
  })
  return (
    <NavList
      data={data}
      renderItem={SessionCard}
      initialFocus={activeSessionId}
      aria-label="Workspaces"
    />
  )
}

// ── 2. Transcript — 샘플 메시지 스트림 ─────────────────────────
const TRANSCRIPT_MESSAGES = [
  { id: 'm1', data: { label: 'You: refactor todoStore to use defineCommands' } },
  { id: 'm2', data: { label: 'Claude: reading src/pages/todo/todoStore.ts' } },
  { id: 'm3', data: { label: 'Claude: found 3 commands. proposing defineCommands migration with typed Command maps.' } },
  { id: 'm4', data: { label: 'Claude: applying edit to todoStore.ts …' } },
  { id: 'm5', data: { label: 'Claude: pnpm typecheck — 0 errors. done.' } },
]

function TranscriptWidget() {
  const data = createStore({
    entities: Object.fromEntries(TRANSCRIPT_MESSAGES.map((m) => [m.id, m])),
    relationships: { [ROOT_ID]: TRANSCRIPT_MESSAGES.map((m) => m.id) },
  })
  return <Feed data={data} aria-label="Transcript" />
}

// ── 3. ComposerMock — placeholder만 보이는 정적 입력 ─────────────
function ComposerMockWidget() {
  const { composerPlaceholder } = useCmuxPreview()
  return <Composer placeholder={composerPlaceholder} />
}

// ── 4. EmptyFiles ─────────────────────────────────────────────
function EmptyFilesWidget() {
  const { filesEmptyTitle } = useCmuxPreview()
  return <EmptyState title={filesEmptyTitle} />
}

// ── 5. EmptyEntities ──────────────────────────────────────────
function EmptyEntitiesWidget() {
  const { entitiesEmptyTitle } = useCmuxPreview()
  return <EmptyState title={entitiesEmptyTitle} />
}

// ── Registry ──────────────────────────────────────────────────
export const cmuxPreviewWidgets = createWidgetRegistry({
  WorkspaceList: WorkspaceListWidget,
  Transcript:    TranscriptWidget,
  ComposerMock:  ComposerMockWidget,
  EmptyFiles:    EmptyFilesWidget,
  EmptyEntities: EmptyEntitiesWidget,
})

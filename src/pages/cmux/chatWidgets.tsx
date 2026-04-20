// ② cmux-layout-prd.md
import { useMemo } from 'react'
import { ax } from '@styles/ax'
import { NavList } from '@os/ui/NavList'
import { EmptyState } from '@os/ui/EmptyState'
import { useFlatLayoutSurface } from '@os/ui/useFlatLayoutSurface'
import { createStore, ROOT_ID } from '@os/schema'
import { SessionCard, type SessionCardModel, type SessionUiState } from '@entities/chat'
import { useChat, type WorkspaceMeta } from './chatContext'
import { ChatPane } from './ChatPane'
import { EntitiesInspectorWidget } from './EntitiesInspectorWidget'

// ── 워크스페이스 → SessionCardModel 어댑터 ──
// SessionCard는 SessionCardModel을 기대. 워크스페이스 최소 메타(label/status/unread)를 카드 모델로 승격.
function workspaceToCard(w: WorkspaceMeta, isActive: boolean): SessionCardModel {
  const uiState: SessionUiState = w.status === 'running' ? 'running' : (isActive ? 'active' : 'idle')
  return {
    id: w.id,
    uiState,
    title: w.label,
    cwd: '',
    branch: null,
    previewText: '',
    msgCount: 0,
    unreadCount: w.unreadCount,
    lastUpdatedAgo: '',
    hasGlow: false,
  }
}

// ── 1. WorkspaceSidebar — 좌측 워크스페이스 리스트 ──
// cmux 모델: workspaces는 길이 1 고정이지만 NavList로 일관 렌더 (향후 확장 대비).

export function WorkspaceSidebarWidget() {
  const { workspaces, activeWorkspaceId } = useChat()

  const data = useMemo(() => createStore({
    entities: Object.fromEntries(
      workspaces.map((w) => [
        w.id,
        { id: w.id, data: { card: workspaceToCard(w, w.id === activeWorkspaceId) } },
      ]),
    ),
    relationships: { [ROOT_ID]: workspaces.map((w) => w.id) },
  }), [workspaces, activeWorkspaceId])

  return (
    <div className={ax({ layout: 'fill' })}>
      <NavList
        data={data}
        renderItem={SessionCard}
        initialFocus={activeWorkspaceId}
        aria-label="Workspaces"
      />
    </div>
  )
}

// ── 2. SurfaceLeaf — 탭 본문 ──
// 현재 탭의 contentType을 읽어 적절한 pane을 렌더. contentType은 layout/flatLayout.ts TabNode 소유.

export function SurfaceLeafWidget() {
  const surface = useFlatLayoutSurface()
  const tabData = surface?.tabData
  const { activeSessionId } = useChat()

  const contentType = tabData?.contentType
  const contentRef = tabData?.contentRef ?? activeSessionId ?? ''

  if (contentType === 'chat') {
    return <ChatPane sessionId={contentRef} />
  }
  if (contentType === 'entities') {
    return <EntitiesInspectorWidget />
  }
  // 'files' 같은 미래 타입 — 지금은 EmptyState.
  return <EmptyState title={tabData?.label ?? 'Unknown surface'} />
}

// ② cmux-layout-prd.md
import { createDomainContext } from '@os/layout'
import type { ChatSession } from './chatStore'

/**
 * cmux 워크스페이스 한 개를 설명하는 메타데이터.
 * workspace=애플리케이션 단위(1개 고정, tabgroup 다수 포함). 좌측 사이드바에서 선택.
 */
export interface WorkspaceMeta {
  id: string
  label: string
  status: 'idle' | 'running'
  unreadCount: number
}

/**
 * Chat 도메인 context — Pull 모델.
 * layoutStore/dispatch/focusedTabgroupId는 useFlatLayout()이 제공하므로 중복 보관하지 않는다.
 */
export interface ChatContextValue {
  sessions: ChatSession[]
  activeSessionId: string | null
  modifiedFiles: string[]
  /** cmux 1-workspace 고정. 길이 1의 readonly 튜플. */
  workspaces: readonly [WorkspaceMeta]
  activeWorkspaceId: string
}

export const [ChatProvider, useChat] = createDomainContext<ChatContextValue>('Chat')

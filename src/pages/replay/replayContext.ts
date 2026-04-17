import type { RefObject } from 'react'
import { createDomainContext } from '@os/layout'
import type { NormalizedData } from '@os/store/types'
import type { ChatMessage } from '@os/ui/chat/types'
import type { FileViewerHandle, ViewerTab } from '@os/ui/viewerTypes'
import type { UseViewerTabsReturn } from './useViewerTabs'
import type { SubAgentSession } from './subAgentTypes'
import type { SubAgentMatch } from './matchSubAgents'

export interface ReplayContextValue {
  selectedId: string
  setSelectedId: (id: string) => void
  sessionEntries: Array<{ id: string; type: 'json' | 'jsonl' }>
  messages: ChatMessage[]
  allMessagesCount: number
  isRunning: boolean
  startReplay: () => void
  editingLine: number | null
  mode: 'replay' | 'live'
  liveSessionId?: string | null
  tabs: ViewerTab[]
  activeTab: ViewerTab | null
  activeTabId: string | null
  setActiveTab: (id: string) => void
  viewerTabData: NormalizedData
  fileViewerRef: RefObject<FileViewerHandle | null>
  viewerTabs: UseViewerTabsReturn
  /**
   * Live 모드에서만 채워짐. Replay 모드면 undefined.
   * @invariant I5 — 원소들의 isActive는 mode==='live' && liveSessionId 활성과 일치
   */
  subagents?: SubAgentSession[]
  /**
   * @invariant I6 — matchSubAgents 결과 그대로. 소비측에서 재매칭 금지
   * @invariant subagents와 길이 일치 (orphan 포함)
   */
  subAgentMatches?: SubAgentMatch[]
}

export const [ReplayProvider, useReplay] = createDomainContext<ReplayContextValue>('Replay')

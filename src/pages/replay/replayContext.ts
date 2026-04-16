import type { RefObject } from 'react'
import { createDomainContext } from '@os/layout'
import type { NormalizedData } from '@os/store/types'
import type { ChatMessage } from '@os/ui/chat/types'
import type { FileViewerHandle, ViewerTab } from '@os/ui/viewerTypes'
import type { UseViewerTabsReturn } from './useViewerTabs'

export interface ReplayContextValue {
  selectedId: string
  setSelectedId: (id: string) => void
  sessionEntries: Array<{ id: string; type: 'json' | 'jsonl' }>
  messages: ChatMessage[]
  isRunning: boolean
  startReplay: () => void
  editingLine: number | null
  mode: 'replay' | 'live'
  setMode: (mode: 'replay' | 'live') => void
  tabs: ViewerTab[]
  activeTab: ViewerTab | null
  activeTabId: string | null
  setActiveTab: (id: string) => void
  viewerTabData: NormalizedData
  fileViewerRef: RefObject<FileViewerHandle | null>
  viewerTabs: UseViewerTabsReturn
}

export const [ReplayProvider, useReplay] = createDomainContext<ReplayContextValue>('Replay')

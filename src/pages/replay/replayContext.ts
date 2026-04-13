import { createContext, useContext } from 'react'
import type { RefObject } from 'react'
import type { NormalizedData } from '@os/store/types'
import type { ChatMessage } from '@os/ui/chat/types'
import type { FileViewerHandle, ViewerTab } from './viewerTypes'
import type { UseViewerTabsReturn } from './useViewerTabs'

export interface ReplayContextValue {
  // session
  selectedId: string
  setSelectedId: (id: string) => void
  sessionEntries: Array<{ id: string; type: 'json' | 'jsonl' }>
  // replay
  messages: ChatMessage[]
  isRunning: boolean
  startReplay: () => void
  // right tab
  rightTab: 'replay' | 'live'
  rightTabData: NormalizedData
  handleRightTabActivate: (nodeId: string) => void
  // viewer tabs
  tabs: ViewerTab[]
  activeTab: ViewerTab | null
  activeTabId: string | null
  setActiveTab: (id: string) => void
  viewerTabData: NormalizedData
  fileViewerRef: RefObject<FileViewerHandle | null>
  // viewer tabs control (for LiveSessionPanel)
  viewerTabs: UseViewerTabsReturn
}

const ReplayContext = createContext<ReplayContextValue | null>(null)

export const ReplayProvider = ReplayContext.Provider

export function useReplay(): ReplayContextValue {
  const ctx = useContext(ReplayContext)
  if (!ctx) throw new Error('useReplay must be used inside ReplayProvider')
  return ctx
}

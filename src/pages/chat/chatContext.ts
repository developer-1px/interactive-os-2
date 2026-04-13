import type { ReactNode } from 'react'
import { createDomainContext } from '@os/layout'
import type { NormalizedData, Entity } from '@os/store/types'
import type { ChatSession } from './chatStore'

export interface ChatContextValue {
  sessions: ChatSession[]
  activeSessionId: string | null
  wsData: NormalizedData
  handleWorkspaceChange: (data: NormalizedData) => void
  handleAddTab: () => void
  handleSidebarClick: (sessionId: string) => void
  renderPanel: (tab: Entity) => ReactNode
}

export const [ChatProvider, useChat] = createDomainContext<ChatContextValue>('Chat')

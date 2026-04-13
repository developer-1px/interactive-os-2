import { createContext, useContext } from 'react'
import type { ReactNode } from 'react'
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

const ChatContext = createContext<ChatContextValue | null>(null)

export const ChatProvider = ChatContext.Provider

export function useChat(): ChatContextValue {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error('useChat must be used inside ChatProvider')
  return ctx
}

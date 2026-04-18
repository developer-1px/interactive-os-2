import { createDomainContext } from '@os/layout'
import type { ChatSession } from './chatStore'

export type SidebarMode = 'sessions' | 'files'

export interface ChatContextValue {
  sessions: ChatSession[]
  activeSessionId: string | null

  sidebarMode: SidebarMode
  setSidebarMode: (mode: SidebarMode) => void

  bottomVisible: boolean
  toggleBottom: () => void

  modifiedFiles: string[]
}

export const [ChatProvider, useChat] = createDomainContext<ChatContextValue>('Chat')

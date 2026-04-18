var e=`// ② 2026-04-17 Agent IDE 3-zone layout
import { useState, useMemo, useCallback } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { updateEntityData } from '@os/store/createStore'
import {
  useActiveSession,
  useChatSessions,
} from './chatStore'
import type { ChatMessage } from '@os/ui/chat/types'
import { ChatProvider, type ChatContextValue, type SidebarMode } from './chatContext'
import { ChatSidebarWidget, ChatAreaWidget, ChatBottomPanelWidget } from './chatWidgets'
import './PageAgentChat.css'

// ── Layout ──

const chatWidgets = createWidgetRegistry({
  Sidebar: ChatSidebarWidget,
  ChatArea: ChatAreaWidget,
  BottomPanel: ChatBottomPanelWidget,
})

const baseLayout = definePage({
  entities: {
    root:        { data: { type: 'split', direction: 'horizontal', sizes: [0.22, 'flex'], resizable: true }, children: ['sidebar', 'main'] },
    sidebar:     { data: { type: 'widget', widget: 'Sidebar', surface: 'sunken' } },
    main:        { data: { type: 'split', direction: 'vertical', sizes: ['flex', 0.3], resizable: true }, children: ['chatArea', 'bottomPanel'] },
    chatArea:    { data: { type: 'widget', widget: 'ChatArea' } },
    bottomPanel: { data: { type: 'widget', widget: 'BottomPanel', surface: 'sunken', hidden: true } },
  },
})

// ── File extraction ──

const FILE_TOOLS = new Set(['Edit', 'Write'])

function extractModifiedFiles(messages: ChatMessage[]): string[] {
  const files = new Set<string>()
  for (const msg of messages) {
    for (const block of msg.blocks) {
      if (block.type !== 'tool_use') continue
      const data = (block as { data: { name?: string; input?: { file_path?: string } } }).data
      if (!data?.name || !FILE_TOOLS.has(data.name)) continue
      const fp = data.input?.file_path
      if (fp) files.add(fp.replace(/.*\\/aria\\//, ''))
    }
  }
  return [...files]
}

// ── Page ──

export default function PageAgentChat() {
  const sessions = useChatSessions()
  const activeSession = useActiveSession()
  const activeSessionId = activeSession?.id ?? null

  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('sessions')
  const [bottomVisible, setBottomVisible] = useState(false)

  const toggleBottom = useCallback(() => setBottomVisible(v => !v), [])

  const chatLayout = useMemo(
    () => updateEntityData(baseLayout, 'bottomPanel', { hidden: !bottomVisible }),
    [bottomVisible],
  )

  const modifiedFiles = useMemo(() => {
    if (!activeSession) return []
    return extractModifiedFiles(activeSession.messages)
  }, [activeSession])

  const chatCtx = useMemo<ChatContextValue>(() => ({
    sessions,
    activeSessionId,
    sidebarMode,
    setSidebarMode,
    bottomVisible,
    toggleBottom,
    modifiedFiles,
  }), [sessions, activeSessionId, sidebarMode, setSidebarMode, bottomVisible, toggleBottom, modifiedFiles])

  return (
    <ChatProvider value={chatCtx}>
      <FlatLayout data={chatLayout} registry={chatWidgets} aria-label="Agent IDE" />
    </ChatProvider>
  )
}
`;export{e as default};
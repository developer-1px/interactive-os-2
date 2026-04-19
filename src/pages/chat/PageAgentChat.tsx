// ② cmux-layout-prd.md
import { useMemo } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import type { FocusStateData } from '@os/layout/layoutCommands'
import {
  useActiveSession,
  useChatSessions,
} from './chatStore'
import type { ChatMessage } from '@os/ui/chat/types'
import { ChatProvider, type ChatContextValue, type WorkspaceMeta } from './chatContext'
import { WorkspaceSidebarWidget, SurfaceLeafWidget } from './chatWidgets'
import { ChatKeybindingsWidget } from './chatKeybindings'
import './PageAgentChat.css'

// ── Layout (cmux 초기 상태) ─────────────────────────────
// root = split(sidebar | main)
// main = tabgroup(t1) → tab → SurfaceLeaf widget (activeSession 기반 Chat pane)
// __focus = FOCUS_STATE_ID state node — layoutCommands.setFocus/splitHere/closeHere가 읽어 dispatch
// ChatKeybindings는 FlatLayout children slot으로 mount (DOM 비점유 side-effect widget).

const chatBaseLayout = definePage({
  entities: {
    root:      { data: { type: 'split', direction: 'horizontal', sizes: [0.22, 'flex'], resizable: true }, children: ['sidebar', 'main'] },
    sidebar:   { data: { type: 'widget', widget: 'WorkspaceSidebar' } },
    main:      { data: { type: 'tabgroup', activeTabId: 't1' }, children: ['t1'] },
    t1:        { data: { type: 'tab', label: 'Chat', contentType: 'chat', contentRef: 'session-1' }, children: ['t1-body'] },
    't1-body': { data: { type: 'widget', widget: 'SurfaceLeaf' } },
    '__focus': { data: { type: 'state', focusedTabgroupId: 'main', focusedTabId: 't1' } satisfies FocusStateData },
  },
})

const chatWidgets = createWidgetRegistry({
  WorkspaceSidebar: WorkspaceSidebarWidget,
  SurfaceLeaf: SurfaceLeafWidget,
})

// ── File extraction ────────────────────────────────────

const FILE_TOOLS = new Set(['Edit', 'Write'])

function extractModifiedFiles(messages: ChatMessage[]): string[] {
  const files = new Set<string>()
  for (const msg of messages) {
    for (const block of msg.blocks) {
      if (block.type !== 'tool_use') continue
      const data = (block as { data: { name?: string; input?: { file_path?: string } } }).data
      if (!data?.name || !FILE_TOOLS.has(data.name)) continue
      const fp = data.input?.file_path
      if (fp) files.add(fp.replace(/.*\/aria\//, ''))
    }
  }
  return [...files]
}

// ── Page ───────────────────────────────────────────────

export default function PageAgentChat() {
  const sessions = useChatSessions()
  const activeSession = useActiveSession()
  const activeSessionId = activeSession?.id ?? null

  const workspaces = useMemo<readonly [WorkspaceMeta]>(
    () => [{
      id: 'ws-1',
      label: 'Claude',
      status: activeSession ? 'running' : 'idle',
      unreadCount: 0,
    }],
    [activeSession],
  )

  const modifiedFiles = useMemo(
    () => activeSession ? extractModifiedFiles(activeSession.messages) : [],
    [activeSession],
  )

  const chatCtx = useMemo<ChatContextValue>(() => ({
    sessions,
    activeSessionId,
    modifiedFiles,
    workspaces,
    activeWorkspaceId: 'ws-1',
  }), [sessions, activeSessionId, modifiedFiles, workspaces])

  return (
    <ChatProvider value={chatCtx}>
      <FlatLayout
        data={chatBaseLayout}
        registry={chatWidgets}
        aria-label="Agent IDE (cmux)"
      >
        <ChatKeybindingsWidget />
      </FlatLayout>
    </ChatProvider>
  )
}

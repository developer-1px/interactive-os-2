// ② cmuxPrd.md — /chat + /chat/entities + /cmux/preview → /cmux 통합
import { useMemo } from 'react'
import { useLocation } from 'react-router-dom'
import { FlatLayout } from '@os/ui/FlatLayout'
import { defineLayout } from '@os/layout/defineLayout'
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
import { parsePreviewQuery, getScenario } from './cmuxPreviewLoader'
import { cmuxPreviewWidgets } from './cmuxPreviewWidgets'
import { CmuxPreviewProvider } from './cmuxPreviewContext'
import { EntitiesInspectorWidget } from './EntitiesInspectorWidget'
import './PageCmux.css'

// ── Default cmux layout ────────────────────────────────
// root = split(sidebar | main)
// main = tabgroup(t1) → tab → SurfaceLeaf widget (activeSession 기반 Chat pane)
// __focus = FOCUS_STATE_ID state node — layoutCommands.setFocus/splitHere/closeHere가 읽어 dispatch

const chatBaseLayout = defineLayout({
  entities: {
    root:      { data: { type: 'split', direction: 'horizontal', sizes: [0.22, 'flex'], resizable: true }, children: ['sidebar', 'main'] },
    sidebar:   { data: { type: 'widget', widget: 'WorkspaceSidebar' } },
    main:      { data: { type: 'tabgroup', activeTabId: 't1' }, children: ['t1'] },
    t1:        { data: { type: 'tab', label: 'Chat', contentType: 'chat', contentRef: 'session-1' }, children: ['t1-body'] },
    't1-body': { data: { type: 'widget', widget: 'SurfaceLeaf' } },
    '__focus': { data: { type: 'state', focusedTabgroupId: 'main', focusedTabId: 't1' } satisfies FocusStateData },
  },
})

const entitiesLayout = defineLayout({
  entities: {
    root:      { data: { type: 'split', direction: 'horizontal', sizes: [0.22, 'flex'], resizable: true }, children: ['sidebar', 'main'] },
    sidebar:   { data: { type: 'widget', widget: 'WorkspaceSidebar' } },
    main:      { data: { type: 'tabgroup', activeTabId: 't1' }, children: ['t1'] },
    t1:        { data: { type: 'tab', label: 'Entities', contentType: 'widget', contentRef: '' }, children: ['t1-body'] },
    't1-body': { data: { type: 'widget', widget: 'EntitiesInspector' } },
    '__focus': { data: { type: 'state', focusedTabgroupId: 'main', focusedTabId: 't1' } satisfies FocusStateData },
  },
})

const cmuxWidgets = createWidgetRegistry({
  WorkspaceSidebar: WorkspaceSidebarWidget,
  SurfaceLeaf: SurfaceLeafWidget,
  EntitiesInspector: EntitiesInspectorWidget,
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

// ── Mode components — hook 순서 안정화 ──────────────────
// preview 모드는 chat store hooks를 사용하지 않는다. React rules of hooks 준수를 위해
// 분기마다 별도 컴포넌트로 분리하여 같은 컴포넌트 안에서 조건부 hook 호출이 없게 만든다.

function PreviewMode({ scenarioId }: { scenarioId: string }) {
  const scenario = getScenario(scenarioId)
  if (!scenario) {
    return <div>{`Unknown cmux preview scenario: ${scenarioId}`}</div>
  }
  return (
    <CmuxPreviewProvider value={scenario.context}>
      <FlatLayout
        data={scenario.page}
        registry={cmuxPreviewWidgets}
        aria-label={`cmux preview — ${scenario.label}`}
      />
    </CmuxPreviewProvider>
  )
}

function ChatMode({ view }: { view: string | null }) {
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

  const layout = view === 'entities' ? entitiesLayout : chatBaseLayout

  return (
    <ChatProvider value={chatCtx}>
      <FlatLayout
        data={layout}
        registry={cmuxWidgets}
        aria-label="cmux"
      >
        <ChatKeybindingsWidget />
      </FlatLayout>
    </ChatProvider>
  )
}

// ── Page ───────────────────────────────────────────────

export default function PageCmux() {
  const { search } = useLocation()
  const previewId = parsePreviewQuery(search)
  if (previewId) return <PreviewMode scenarioId={previewId} />
  const view = new URLSearchParams(search).get('view')
  return <ChatMode view={view} />
}

// ② 2026-03-28-workspace-sync-prd.md
// @useState-hatch — wsData: Workspace NormalizedData (os ui component owns its own store)
import { useEffect, useRef, useCallback, useMemo } from 'react'
import { FlatLayout } from '@os/ui/FlatLayout'
import { definePage } from '@os/layout/flatLayout'
import { createWidgetRegistry } from '@os/layout/widgetRegistry'
import { ChatPane } from './ChatPane'
import {
  createSession,
  closeSession,
  setActiveSession,
  useActiveSession,
  useChatSessions,
} from './chatStore'
import type { Entity } from '@os/store/types'
import type { NormalizedData } from '@os/store/types'
import { useStore } from '@os/store/useStore'
import {
  getChildren,
  getEntityData,
  updateEntityData,
} from '@os/store/createStore'
import { ROOT_ID } from '@os/store/types'
import type { PaneSize } from '@os/store/types'
import {
  createWorkspace,
  workspaceCommands,
  collectContentRefs,
  splitAndAddTab,
  findTabgroup,
} from '@os/plugins/workspaceStore'
import type { TabData, SplitData } from '@os/plugins/workspaceStore'
import { ChatProvider, type ChatContextValue } from './chatContext'
import { ChatSidebarWidget, ChatWorkspaceWidget } from './chatWidgets'
import './PageAgentChat.css'

// ── Layout ──

const chatWidgets = createWidgetRegistry({
  ChatSidebar: ChatSidebarWidget,
  ChatWorkspace: ChatWorkspaceWidget,
})

const chatLayout = definePage({
  entities: {
    root:      { data: { type: 'split', direction: 'horizontal', sizes: [0.2, 'flex'], resizable: false }, children: ['sidebar', 'workspace'] },
    sidebar:   { data: { type: 'widget', widget: 'ChatSidebar', surface: 'raised' } },
    workspace: { data: { type: 'widget', widget: 'ChatWorkspace' } },
  },
})

// ── Helpers ──

function sessionToTab(session: { id: string }): Entity {
  return {
    id: `tab-${session.id}`,
    data: { type: 'tab', label: session.id.slice(0, 8), contentType: 'chat', contentRef: session.id },
  }
}

function syncAsSplitPanes(
  store: NormalizedData,
  sessions: { id: string }[],
): NormalizedData {
  const existingRefs = collectContentRefs(store)
  const sessionIds = new Set(sessions.map(s => s.id))

  const toAdd = sessions.filter(s => !existingRefs.has(s.id))
  const toRemove = [...existingRefs.entries()].filter(([ref]) => !sessionIds.has(ref))

  if (toAdd.length === 0 && toRemove.length === 0) return store

  let s = store

  for (const [, tabId] of toRemove) {
    s = workspaceCommands.removeTab.reduce(s, tabId)
  }

  for (const session of toAdd) {
    const tab = sessionToTab(session)
    const existingTg = findTabgroup(s)

    if (existingTg) {
      const existingTabs = getChildren(s, existingTg)
      if (existingTabs.length === 0) {
        s = workspaceCommands.createTab.reduce(s, existingTg, tab)
        s = workspaceCommands.setActiveTab.reduce(s, existingTg, tab.id)
      } else {
        s = splitAndAddTab(s, existingTg, 'horizontal', tab)
      }
    }
  }

  const rootChildren = getChildren(s, ROOT_ID)
  if (rootChildren.length === 1) {
    const rootChild = rootChildren[0]
    const data = getEntityData<SplitData>(s, rootChild)
    if (data?.type === 'split') {
      const paneCount = getChildren(s, rootChild).length
      if (paneCount > 1) {
        const ratio = 1 / paneCount
        const sizes: PaneSize[] = Array.from({ length: paneCount }, (_, i) =>
          i === paneCount - 1 ? 'flex' as PaneSize : ratio as PaneSize,
        )
        s = updateEntityData(s, rootChild, { sizes })
      }
    }
  }

  return s
}

// ── Page ──

export default function PageAgentChat() {
  const sessions = useChatSessions()
  const activeSession = useActiveSession()
  const activeSessionId = activeSession?.id ?? null

  const [wsData, setWsData] = useStore(() => syncAsSplitPanes(createWorkspace(), sessions))
  const wsDataRef = useRef(wsData)

  useEffect(() => {
    const synced = syncAsSplitPanes(wsDataRef.current, sessions)
    if (synced !== wsDataRef.current) {
      wsDataRef.current = synced
      setWsData(synced)
    }
  }, [sessions]) // eslint-disable-line react-hooks/exhaustive-deps

  const handleWorkspaceChange = useCallback((newData: NormalizedData) => {
    const oldRefs = collectContentRefs(wsDataRef.current)
    const newRefs = collectContentRefs(newData)
    for (const [ref] of oldRefs) {
      if (!newRefs.has(ref)) closeSession(ref)
    }
    wsDataRef.current = newData
    setWsData(newData)
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddTab = useCallback(() => { createSession() }, [])

  const handleSidebarClick = useCallback((sessionId: string) => {
    setActiveSession(sessionId)
  }, [])

  const renderPanel = useCallback((tab: Entity) => {
    const tabData = tab.data as unknown as TabData
    if (!tabData?.contentRef) return null
    return <ChatPane sessionId={tabData.contentRef} />
  }, [])

  const chatCtx = useMemo<ChatContextValue>(() => ({
    sessions, activeSessionId, wsData,
    handleWorkspaceChange, handleAddTab, handleSidebarClick, renderPanel,
  }), [sessions, activeSessionId, wsData, handleWorkspaceChange, handleAddTab, handleSidebarClick, renderPanel])

  return (
    <ChatProvider value={chatCtx}>
      <FlatLayout data={chatLayout} registry={chatWidgets} aria-label="Chat" />
    </ChatProvider>
  )
}

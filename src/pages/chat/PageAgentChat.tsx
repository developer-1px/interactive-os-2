// ② 2026-03-28-workspace-sync-prd.md
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Plus, X, Circle } from 'lucide-react'
import { ChatPane } from './ChatPane'
import {
  createSession,
  closeSession,
  setActiveSession,
  useActiveSession,
  useChatSessions,
} from './chatStore'
import { Workspace } from '../../interactive-os/ui/Workspace'
import {
  createWorkspace,
  workspaceCommands,
  findTabgroup,
  syncFromExternal,
  splitAndAddTab,
  collectContentRefs,
} from '../../interactive-os/plugins/workspaceStore'
import type { TabData } from '../../interactive-os/plugins/workspaceStore'
import { useLayoutKeys } from '../../hooks/useLayoutKeys'
import { getChildren } from '../../interactive-os/store/createStore'
import type { NormalizedData, Entity } from '../../interactive-os/store/types'
import styles from './PageAgentChat.module.css'

// --- Helpers ---

function sessionToTab(session: { id: string }): Entity {
  return {
    id: `tab-${session.id}`,
    data: { type: 'tab', label: session.id.slice(0, 8), contentType: 'chat', contentRef: session.id },
  }
}

// --- Component ---

export default function PageAgentChat() {
  const sessions = useChatSessions()
  const activeSession = useActiveSession()
  const activeSessionId = activeSession?.id ?? null

  // Workspace layout state — sync sessions as external items
  const [wsBase, setWsBase] = useState(() => createWorkspace())
  const wsData = useMemo(
    () => syncFromExternal(wsBase, sessions, sessionToTab),
    [wsBase, sessions],
  )
  const wsDataRef = useRef(wsData)

  useEffect(() => { wsDataRef.current = wsData }, [wsData])

  // Workspace onChange: detect tab removal → close chat session
  const handleWorkspaceChange = useCallback((newData: NormalizedData) => {
    const oldRefs = collectContentRefs(wsDataRef.current)
    const newRefs = collectContentRefs(newData)
    for (const [ref] of oldRefs) {
      if (!newRefs.has(ref)) {
        closeSession(ref)
      }
    }
    setWsBase(newData)
  }, [])

  // Cmd+D → split workspace + create session in new tabgroup
  const layoutHandlers = useMemo(() => ({
    splitH: () => {
      const sessionId = createSession()
      setWsBase(prev => {
        const tgId = findTabgroup(prev)
        if (!tgId) return prev
        const hasExistingTabs = getChildren(prev, tgId).length > 0
        if (!hasExistingTabs) return prev
        return splitAndAddTab(prev, tgId, 'horizontal', sessionToTab({ id: sessionId }))
      })
    },
  }), [])
  const { onKeyDown: handleLayoutKeyDown } = useLayoutKeys(layoutHandlers)

  // Sidebar: click session → activate tab in workspace
  const handleSidebarClick = useCallback((sessionId: string) => {
    setActiveSession(sessionId)
    setWsBase(prev => {
      const tabId = `tab-${sessionId}`
      if (!prev.entities[tabId]) return prev
      for (const [id, entity] of Object.entries(prev.entities)) {
        const d = entity.data as Record<string, unknown> | undefined
        if (d?.type === 'tabgroup') {
          const children = getChildren(prev, id)
          if (children.includes(tabId)) {
            return workspaceCommands.setActiveTab(id, tabId).execute(prev)
          }
        }
      }
      return prev
    })
  }, [])

  // Render chat panel for each tab
  const renderPanel = useCallback((tab: Entity) => {
    const tabData = tab.data as unknown as TabData
    if (!tabData?.contentRef) return null
    return <ChatPane sessionId={tabData.contentRef} />
  }, [])

  return (
    <div className={styles.chat} onKeyDown={handleLayoutKeyDown}>
      <div className={styles.chatSidebar}>
        <div className={styles.chatSidebarHeader}>
          <span>Sessions</span>
          <button className={styles.chatNewBtn} onClick={createSession} aria-label="New session">
            <Plus size={14} />
          </button>
        </div>
        <div className={styles.chatSessionList}>
          {sessions.map(s => (
            <div
              key={s.id}
              className={`${styles.chatSessionItem} ${s.id === activeSessionId ? styles.chatSessionActive : ''}`}
              onClick={() => handleSidebarClick(s.id)}
            >
              <Circle size={8} fill="currentColor" className={s.state === 'running' ? styles.chatRunning : styles.chatIdle} />
              <span className="truncate">{s.id.slice(0, 8)}</span>
              <button
                className={styles.chatCloseBtn}
                onClick={(e) => { e.stopPropagation(); closeSession(s.id) }}
                aria-label={`Close session ${s.id.slice(0, 8)}`}
              >
                <X size={12} />
              </button>
            </div>
          ))}
          {sessions.length === 0 && (
            <div className={styles.chatEmpty}>No sessions</div>
          )}
        </div>
      </div>

      {sessions.length > 0 ? (
        <Workspace
          data={wsData}
          onChange={handleWorkspaceChange}
          renderPanel={renderPanel}
          aria-label="Chat workspace"
        />
      ) : (
        <div className={styles.chatMain}>
          <div className={styles.chatWelcome}>
            <p>Start a new Claude Code session</p>
            <button className={styles.chatStartBtn} onClick={createSession}>
              <Plus size={16} /> New Session
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

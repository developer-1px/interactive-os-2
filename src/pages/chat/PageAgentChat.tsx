// ② 2026-03-28-workspace-sync-prd.md
import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { Plus, X, Circle, FileText } from 'lucide-react'
import { ChatPane } from './ChatPane'
import {
  createSession,
  closeSession,
  setActiveSession,
  useActiveSession,
  useChatSessions,
} from './chatStore'
import type { ChatSession } from './chatStore'
import type { ChatMessage } from '../../interactive-os/ui/chat/types'
import { Workspace } from '../../interactive-os/ui/Workspace'
import {
  createWorkspace,
  workspaceCommands,
  collectContentRefs,
  splitAndAddTab,
  findTabgroup,
} from '../../interactive-os/plugins/workspaceStore'
import type { TabData, SplitData } from '../../interactive-os/plugins/workspaceStore'
import { ROOT_ID } from '../../interactive-os/store/types'
import type { NormalizedData, Entity } from '../../interactive-os/store/types'
import {
  getChildren,
  getEntityData,
  updateEntityData,
} from '../../interactive-os/store/createStore'
import { useLayoutKeys } from '../../hooks/useLayoutKeys'
import type { PaneSize } from '../../interactive-os/store/types'
import styles from './PageAgentChat.module.css'

// --- File extraction ---

const FILE_TOOLS = new Set(['Edit', 'Write', 'Read'])

function extractModifiedFiles(messages: ChatMessage[]): string[] {
  const files = new Set<string>()
  for (const msg of messages) {
    for (const block of msg.blocks) {
      if (block.type !== 'tool_use') continue
      const data = (block as { data: { name?: string; input?: { file_path?: string } } }).data
      if (!data?.name || !FILE_TOOLS.has(data.name)) continue
      if (data.name === 'Read') continue
      const fp = data.input?.file_path
      if (fp) files.add(fp.replace(/.*\/aria\//, ''))
    }
  }
  return [...files]
}

function SessionFileList({ session }: { session: ChatSession }) {
  const files = useMemo(() => extractModifiedFiles(session.messages), [session.messages])
  if (files.length === 0) return null
  return (
    <div className={styles.chatFileList}>
      {files.map(f => (
        <div key={f} className={`${styles.chatFileItem} flex-row items-center`}>
          <FileText size={10} />
          <span className="truncate">{f.split('/').pop()}</span>
        </div>
      ))}
    </div>
  )
}

// --- Helpers ---

function sessionToTab(session: { id: string }): Entity {
  return {
    id: `tab-${session.id}`,
    data: { type: 'tab', label: session.id.slice(0, 8), contentType: 'chat', contentRef: session.id },
  }
}

/**
 * Sync sessions as split panes: each session gets its own tabgroup in a horizontal split.
 * - 1 session → single tabgroup (no split)
 * - 2+ sessions → split(horizontal) → tabgroup per session
 */
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

  // Remove closed sessions
  for (const [, tabId] of toRemove) {
    s = workspaceCommands.removeTab.reduce(s, tabId)
  }

  // Add new sessions
  for (const session of toAdd) {
    const tab = sessionToTab(session)
    const existingTg = findTabgroup(s)

    if (existingTg) {
      // Check if existing tabgroup already has a tab
      const existingTabs = getChildren(s, existingTg)
      if (existingTabs.length === 0) {
        // Empty tabgroup — just add here
        s = workspaceCommands.createTab.reduce(s, existingTg, tab)
        s = workspaceCommands.setActiveTab.reduce(s, existingTg, tab.id)
      } else {
        // Already has a tab → split and add to new pane
        s = splitAndAddTab(s, existingTg, 'horizontal', tab)
      }
    }
  }

  // Equalize split sizes
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

// --- Component ---

export default function PageAgentChat() {
  const sessions = useChatSessions()
  const activeSession = useActiveSession()
  const activeSessionId = activeSession?.id ?? null

  const [wsData, setWsData] = useState(() => syncAsSplitPanes(createWorkspace(), sessions))
  const wsDataRef = useRef(wsData)

  useEffect(() => {
    const synced = syncAsSplitPanes(wsDataRef.current, sessions)
    if (synced !== wsDataRef.current) {
      wsDataRef.current = synced
      setWsData(synced)
    }
  }, [sessions])

  const handleWorkspaceChange = useCallback((newData: NormalizedData) => {
    const oldRefs = collectContentRefs(wsDataRef.current)
    const newRefs = collectContentRefs(newData)
    for (const [ref] of oldRefs) {
      if (!newRefs.has(ref)) {
        closeSession(ref)
      }
    }
    wsDataRef.current = newData
    setWsData(newData)
  }, [])

  const layoutHandlers = useMemo(() => ({
    splitH: () => {
      createSession()
    },
  }), [])
  const { onKeyDown: handleLayoutKeyDown } = useLayoutKeys(layoutHandlers)

  const handleSidebarClick = useCallback((sessionId: string) => {
    setActiveSession(sessionId)
  }, [])

  const renderPanel = useCallback((tab: Entity) => {
    const tabData = tab.data as unknown as TabData
    if (!tabData?.contentRef) return null
    return <ChatPane sessionId={tabData.contentRef} />
  }, [])

  return (
    <div className={`${styles.chat} flex-row h-full min-h-0 overflow-hidden`} onKeyDown={handleLayoutKeyDown}>
      <div className={`${styles.chatSidebar} flex-col shrink-0`}>
        <div className={`${styles.chatSidebarHeader} flex-row items-center justify-between shrink-0`}>
          <span>Sessions</span>
          <button className={`${styles.chatNewBtn} flex-row items-center justify-center border-none cursor-pointer`} onClick={createSession} aria-label="New session">
            <Plus size={14} />
          </button>
        </div>
        <div className={`${styles.chatSessionList} flex-1 overflow-y-auto`}>
          {sessions.map(s => (
            <div
              key={s.id}
              className={`${styles.chatSessionItem} flex-col cursor-pointer ${s.id === activeSessionId ? styles.chatSessionActive : ''}`}
              onClick={() => handleSidebarClick(s.id)}
            >
              <div className="flex-row items-center">
                <Circle size={8} fill="currentColor" className={s.state === 'running' ? styles.chatRunning : styles.chatIdle} />
                <span className="truncate">{s.id.slice(0, 8)}</span>
                <button
                  className={`${styles.chatCloseBtn} flex-row items-center justify-center border-none cursor-pointer`}
                  onClick={(e) => { e.stopPropagation(); closeSession(s.id) }}
                  aria-label={`Close session ${s.id.slice(0, 8)}`}
                >
                  <X size={12} />
                </button>
              </div>
              <SessionFileList session={s} />
            </div>
          ))}
          {sessions.length === 0 && (
            <div className={`${styles.chatEmpty} text-center`}>No sessions</div>
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
        <div className={`${styles.chatMain} flex-col flex-1 h-full min-h-0 w-full`}>
          <div className={`${styles.chatWelcome} flex-col items-center justify-center flex-1`}>
            <p>Start a new Claude Code session</p>
            <button className={`${styles.chatStartBtn} flex-row items-center cursor-pointer`} onClick={createSession}>
              <Plus size={16} /> New Session
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

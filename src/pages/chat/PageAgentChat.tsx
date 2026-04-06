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
import type { ChatMessage } from '@os/ui/chat/types'
import { Workspace } from '@os/ui/Workspace'
import {
  createWorkspace,
  workspaceCommands,
  collectContentRefs,
  splitAndAddTab,
  findTabgroup,
} from '@os/plugins/workspaceStore'
import type { TabData, SplitData } from '@os/plugins/workspaceStore'
import { ROOT_ID } from '@os/store/types'
import type { NormalizedData, Entity } from '@os/store/types'
import {
  getChildren,
  getEntityData,
  updateEntityData,
} from '@os/store/createStore'
import { useKeyMap } from '@os/primitives/useKeyMap'
import type { PaneSize } from '@os/store/types'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import { PanelHeader } from '@os/ui/PanelHeader'
import './PageAgentChat.css'

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
    <div className="chat-file-list">
      {files.map(f => (
        <div key={f} className={ax({ layout: 'bar', gap: 'xs', textStyle: 'caption', text: 'muted' })}>
          <FileText size={10} />
          <span className={ax({ clamp: '1' })}>{f.split('/').pop()}</span>
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
  const { onKeyDown: handleLayoutKeyDown } = useKeyMap(layoutHandlers)

  const handleAddTab = useCallback(() => {
    createSession()
  }, [])

  const handleSidebarClick = useCallback((sessionId: string) => {
    setActiveSession(sessionId)
  }, [])

  const renderPanel = useCallback((tab: Entity) => {
    const tabData = tab.data as unknown as TabData
    if (!tabData?.contentRef) return null
    return <ChatPane sessionId={tabData.contentRef} />
  }, [])

  return (
    <div className={`overflow-hidden chat-page ${ax({ layout: 'row' })}`} onKeyDown={handleLayoutKeyDown}>
      <div className={ax({ surface: 'sunken', layout: 'stack', flex: 'none', border: 'end' }) + ' ' + 'chat-sidebar'}>
        <PanelHeader axes={{ layout: 'spread' }}>
          <span>Sessions</span>
          <button className={ax({ surface: 'ghost', layout: 'center', controlSize: 'sm', icon: 'lg' })} onClick={createSession} aria-label="New session">
            <Plus size={14} />
          </button>
        </PanelHeader>
        <div className={ax({ layout: 'scroll', flex: '1', padding: 'xs', gap: 'xs' })}>
          {sessions.map(s => {
            const isActive = s.id === activeSessionId
            return (
            <div
              key={s.id}
              className={`${ax({ surface: isActive ? 'display' : 'ghost', layout: 'stack', gap: 'xs', padding: 'xs', text: isActive ? 'primary' : 'secondary', shape: 'sm' })} chat-session-item`}
              onClick={() => handleSidebarClick(s.id)}
            >
              <div className={ax({ layout: 'bar', gap: 'sm' })}>
                <Circle size={8} fill="currentColor" className={s.state === 'running' ? ax({ tone: 'success' }) : ax({ text: 'muted' })} />
                <span className={ax({ flex: '1', clamp: '1' })}>{s.id.slice(0, 8)}</span>
                <button
                  className={ax({ surface: 'ghost', layout: 'center' }) + ' ' + 'chat-close-btn'}
                  onClick={(e) => { e.stopPropagation(); closeSession(s.id) }}
                  aria-label={`Close session ${s.id.slice(0, 8)}`}
                >
                  <X size={12} />
                </button>
              </div>
              <SessionFileList session={s} />
            </div>
            )
          })}
          {sessions.length === 0 && (
            <div className={ax({ padding: 'md', textStyle: 'caption', text: 'muted' })}>No sessions</div>
          )}
        </div>
      </div>

      {sessions.length > 0 ? (
        <Workspace
          data={wsData}
          onChange={handleWorkspaceChange}
          onAddTab={handleAddTab}
          renderPanel={renderPanel}
          aria-label="Chat workspace"
        />
      ) : (
        <div className={ax({ layout: 'fill', width: 'full' }) + ' ' + 'chat-main'}>
          <div className={ax({ layout: 'center', flex: '1', gap: 'md', text: 'muted' })}>
            <p>Start a new Claude Code session</p>
            <button className={ax({ surface: 'ghost', controlSize: 'md', padding: 'sm', content: 'text', layout: 'bar', gap: 'xs', text: 'primary', border: 'subtle' }) + ' ' + 'chat-start-btn'} onClick={createSession}>
              <Plus size={16} /> New Session
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

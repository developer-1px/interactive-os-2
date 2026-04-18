var e=`import { useMemo, useCallback } from 'react'
import { Plus, Terminal } from 'lucide-react'
import { ax } from '@styles/ax'
import { Badge } from '@os/ui/Badge'
import { Button } from '@os/ui/Button'
import { ListBox } from '@os/ui/ListBox'
import { PanelHeader } from '@os/ui/PanelHeader'
import { SessionList } from '@os/ui/SessionList'
import { TabList } from '@os/ui/TabList'
import type { SessionItemOptions } from '@os/ui/items'
import { createStore, ROOT_ID } from '@os/schema'
import { useChat } from './chatContext'
import { createSession, closeSession, setActiveSession, useActiveSession } from './chatStore'
import { ChatPane } from './ChatPane'
import type { NormalizedData } from '@os/store/types'

// ── Sidebar tabs data ──

function buildTabData(): NormalizedData {
  return createStore({
    entities: {
      sessions: { id: 'sessions', data: { label: 'Sessions' } },
      files: { id: 'files', data: { label: 'Files' } },
    },
    relationships: { [ROOT_ID]: ['sessions', 'files'] },
  })
}

const sidebarTabData = buildTabData()

// ── Sidebar: Sessions list ──

function SessionsPanel() {
  const { sessions, activeSessionId } = useChat()

  const navData = useMemo(() => {
    const entities: Record<string, { id: string; data: { label: string; state: string } }> = {}
    const rootIds: string[] = []
    for (const s of sessions) {
      entities[s.id] = { id: s.id, data: { label: s.id.slice(0, 8), state: s.state } }
      rootIds.push(s.id)
    }
    return createStore({ entities, relationships: { [ROOT_ID]: rootIds } })
  }, [sessions])

  const handleActivate = useCallback((nodeId: string) => {
    setActiveSession(nodeId)
  }, [])

  const getItemOptions = useCallback((nodeId: string): SessionItemOptions => {
    const data = navData.entities[nodeId]?.data as { state: string } | undefined
    return {
      status: data?.state === 'running' ? 'running' : 'idle',
      onClose: (id) => closeSession(id),
    }
  }, [navData])

  if (sessions.length === 0) {
    return <div className={ax({ padding: 'md', textStyle: 'caption', text: 'muted' })}>No sessions</div>
  }

  return (
    <SessionList
      data={navData}
      onActivate={handleActivate}
      itemOptions={getItemOptions}
      initialFocus={activeSessionId ?? undefined}
      aria-label="Sessions"
    />
  )
}

// ── Sidebar: Files list ──

function FilesPanel() {
  const { modifiedFiles } = useChat()

  const fileData = useMemo(() => {
    const entities: Record<string, { id: string; data: { label: string } }> = {}
    const rootIds: string[] = []
    for (const f of modifiedFiles) {
      entities[f] = { id: f, data: { label: f } }
      rootIds.push(f)
    }
    return createStore({ entities, relationships: { [ROOT_ID]: rootIds } })
  }, [modifiedFiles])

  if (modifiedFiles.length === 0) {
    return <div className={ax({ padding: 'md', textStyle: 'caption', text: 'muted' })}>No modified files</div>
  }

  return (
    <ListBox data={fileData} aria-label="Modified files" />
  )
}

// ── Sidebar Widget ──

export function ChatSidebarWidget() {
  const { sidebarMode, setSidebarMode } = useChat()

  const handleTabActivate = useCallback((tabId: string) => {
    setSidebarMode(tabId as 'sessions' | 'files')
  }, [setSidebarMode])

  return (
    <div className={ax({ layout: 'fill' })}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <TabList
          data={sidebarTabData}
          onActivate={handleTabActivate}
          initialFocus={sidebarMode}
          aria-label="Sidebar tabs"
        />
        <Button icon onClick={createSession} aria-label="New session">
          <Plus size={14} />
        </Button>
      </PanelHeader>
      {sidebarMode === 'sessions' ? <SessionsPanel /> : <FilesPanel />}
    </div>
  )
}

// ── Chat Area Widget ──

export function ChatAreaWidget() {
  const { sessions, activeSessionId } = useChat()
  const activeSession = useActiveSession()

  if (!activeSession || sessions.length === 0) {
    return (
      <div className={ax({ layout: 'center', flex: '1', gap: 'md', text: 'muted' })}>
        <p>Start a new Claude Code session</p>
        <Button variant="dialog" className="chat-start-btn" onClick={createSession}>
          <Plus size={16} /> New Session
        </Button>
      </div>
    )
  }

  return <ChatPane sessionId={activeSessionId!} />
}

// ── Bottom Panel Widget (tool log) ──

export function ChatBottomPanelWidget() {
  const activeSession = useActiveSession()

  const toolCalls = useMemo(() => {
    if (!activeSession) return []
    const calls: { id: string; name: string; status: string }[] = []
    for (const msg of activeSession.messages) {
      msg.blocks.forEach((block, blockIndex) => {
        if (block.type === 'tool_use' || block.type === 'tool_summary') {
          const data = (block as { data: { name?: string; status?: string } }).data
          if (data?.name) {
            calls.push({ id: \`\${msg.id}-\${blockIndex}-\${data.name}\`, name: data.name, status: data.status ?? 'done' })
          }
        }
      })
    }
    return calls
  }, [activeSession])

  return (
    <div className={ax({ layout: 'fill' })}>
      <PanelHeader axes={{ layout: 'spread' }}>
        <span className={ax({ layout: 'bar', gap: 'xs' })}>
          <Terminal size={14} />
          <span>Tool Log</span>
          {toolCalls.length > 0 && <Badge tone="neutral" variant="outline">{toolCalls.length}</Badge>}
        </span>
      </PanelHeader>
      <div className={ax({ flex: '1', scroll: 'y', padding: 'sm', textStyle: 'code', gap: 'xs', layout: 'stack' })}>
        {toolCalls.length === 0 ? (
          <div className={ax({ text: 'muted', textStyle: 'caption' })}>No tool calls yet</div>
        ) : (
          toolCalls.map(tc => (
            <div key={tc.id} className={ax({ layout: 'bar', gap: 'sm' })}>
              <Badge tone={tc.status === 'error' ? 'danger' : 'success'} variant="outline">{tc.status}</Badge>
              <span>{tc.name}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
`;export{e as default};
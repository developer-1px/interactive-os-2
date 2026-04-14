import { useMemo, useCallback } from 'react'
import { Plus } from 'lucide-react'
import { ax } from '@styles/ax'
import { Badge } from '@os/ui/Badge'
import { Button } from '@os/ui/Button'
import { PanelHeader } from '@os/ui/PanelHeader'
import { SessionList } from '@os/ui/SessionList'
import { Workspace } from '@os/ui/Workspace'
import type { SessionItemOptions } from '@os/ui/items'
import { createStore, ROOT_ID } from '@os/schema'
import { useChat } from './chatContext'
import { createSession, closeSession } from './chatStore'
import type { ChatSession } from './chatStore'
import type { ChatMessage } from '@os/ui/chat/types'

// ── File extraction ──

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
    <div className={ax({ layout: 'wrap', gap: 'xs' })}>
      {files.map(f => (
        <Badge key={f} tone="neutral" variant="outline">{f.split('/').pop()}</Badge>
      ))}
    </div>
  )
}

// ── Sidebar ──

export function ChatSidebarWidget() {
  const { sessions, activeSessionId, handleSidebarClick } = useChat()

  const navData = useMemo(() => {
    const entities: Record<string, { id: string; data: { label: string; state: string } }> = {}
    const rootIds: string[] = []
    for (const s of sessions) {
      entities[s.id] = { id: s.id, data: { label: s.id.slice(0, 8), state: s.state } }
      rootIds.push(s.id)
    }
    return createStore({ entities, relationships: { [ROOT_ID]: rootIds } })
  }, [sessions])

  const sessionMap = useMemo(() => {
    const map = new Map<string, ChatSession>()
    for (const s of sessions) map.set(s.id, s)
    return map
  }, [sessions])

  const handleActivate = useCallback((nodeId: string) => {
    handleSidebarClick(nodeId)
  }, [handleSidebarClick])

  const getItemOptions = useCallback((nodeId: string): SessionItemOptions => {
    const session = sessionMap.get(nodeId)
    const data = navData.entities[nodeId]?.data as { state: string } | undefined
    return {
      status: data?.state === 'running' ? 'running' : 'idle',
      onClose: (id) => closeSession(id),
      footer: session ? <SessionFileList session={session} /> : undefined,
    }
  }, [sessionMap, navData])

  return (
    <>
      <PanelHeader axes={{ layout: 'spread' }}>
        <span>Sessions</span>
        <Button icon onClick={createSession} aria-label="New session">
          <Plus size={14} />
        </Button>
      </PanelHeader>
      {sessions.length === 0 ? (
        <div className={ax({ padding: 'md', textStyle: 'caption', text: 'muted' })}>No sessions</div>
      ) : (
        <SessionList
          data={navData}
          onActivate={handleActivate}
          itemOptions={getItemOptions}
          initialFocus={activeSessionId ?? undefined}
          aria-label="Sessions"
        />
      )}
    </>
  )
}

// ── Workspace (includes empty state) ──

export function ChatWorkspaceWidget() {
  const { sessions, wsData, handleWorkspaceChange, handleAddTab, renderPanel } = useChat()

  if (sessions.length === 0) {
    return (
      <div className={ax({ layout: 'center', flex: '1', gap: 'md', text: 'muted' })}>
        <p>Start a new Claude Code session</p>
        <Button variant="dialog" className="chat-start-btn" onClick={createSession}>
          <Plus size={16} /> New Session
        </Button>
      </div>
    )
  }

  return (
    <Workspace
      data={wsData}
      onChange={handleWorkspaceChange}
      onAddTab={handleAddTab}
      renderPanel={renderPanel}
      aria-label="Chat workspace"
    />
  )
}

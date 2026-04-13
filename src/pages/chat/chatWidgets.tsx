import { useMemo } from 'react'
import { Plus, X, Circle, FileText } from 'lucide-react'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'
import { PanelHeader } from '@os/ui/PanelHeader'
import { Workspace } from '@os/ui/Workspace'
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

// ── Sidebar ──

export function ChatSidebarWidget() {
  const { sessions, activeSessionId, handleSidebarClick } = useChat()

  return (
    <>
      <PanelHeader axes={{ layout: 'spread' }}>
        <span>Sessions</span>
        <button className={ax({ surface: 'ghost', layout: 'center', controlSize: 'sm', icon: 'lg' })} onClick={createSession} aria-label="New session">
          <Plus size={14} />
        </button>
      </PanelHeader>
      <ScrollArea className={ax({ flex: '1', padding: 'xs', gap: 'xs' })}>
        {sessions.map(s => {
          const isActive = s.id === activeSessionId
          return (
            <div
              key={s.id}
              className={`${ax({ surface: isActive ? 'display' : 'ghost', layout: 'stack', gap: 'xs', padding: 'xs', text: isActive ? 'primary' : 'secondary', shape: 'sm' })} chat-session-item`}
              onClick={(e) => { if (e.defaultPrevented) return; handleSidebarClick(s.id) }}
            >
              <div className={ax({ layout: 'bar', gap: 'sm' })}>
                <Circle size={8} fill="currentColor" className={s.state === 'running' ? ax({ tone: 'success' }) : ax({ text: 'muted' })} />
                <span className={ax({ flex: '1', clamp: '1' })}>{s.id.slice(0, 8)}</span>
                <button
                  className={ax({ surface: 'ghost', layout: 'center' }) + ' ' + 'chat-close-btn'}
                  onClick={(e) => { e.preventDefault(); closeSession(s.id) }}
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
      </ScrollArea>
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
        <button className={ax({ interactive: 'button', controlSize: 'md', padding: 'sm', content: 'text', layout: 'bar', gap: 'xs', text: 'primary', border: 'subtle' }) + ' ' + 'chat-start-btn'} onClick={createSession}>
          <Plus size={16} /> New Session
        </button>
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

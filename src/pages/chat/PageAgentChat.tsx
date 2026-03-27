// ② 2026-03-27-claude-chat-phase-a-prd.md
import { useCallback, useMemo } from 'react'
import { Plus, X, Circle } from 'lucide-react'
import { ChatFeed } from '../../interactive-os/ui/chat/ChatFeed'
import { ChatInput } from '../../interactive-os/ui/chat/ChatInput'
import {
  createSession,
  sendMessage,
  closeSession,
  setActiveSession,
  useActiveSession,
  useChatSessions,
} from './chatStore'
import type { ChatMessage } from '../../interactive-os/ui/chat/types'
import styles from './PageAgentChat.module.css'

export default function PageAgentChat() {
  const sessions = useChatSessions()
  const activeSession = useActiveSession()
  const activeSessionId = activeSession?.id ?? null

  const handleSubmit = useCallback((text: string) => {
    if (!activeSessionId) return
    sendMessage(activeSessionId, text)
  }, [activeSessionId])

  const messages: ChatMessage[] = useMemo(() => {
    if (!activeSession) return []
    if (!activeSession.streamingText) return activeSession.messages
    return [
      ...activeSession.messages,
      {
        id: 'streaming',
        role: 'assistant' as const,
        ts: 0,
        blocks: [{ type: 'text' as const, content: activeSession.streamingText }],
      },
    ]
  }, [activeSession])

  const isStreaming = activeSession?.state === 'running'

  return (
    <div className={styles.chat}>
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
              onClick={() => setActiveSession(s.id)}
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

      <div className={styles.chatMain}>
        {activeSession ? (
          <>
            <ChatFeed
              messages={messages}
              isStreaming={isStreaming}
              streamingLabel="Thinking"
              className={styles.chatFeed}
            />
            <ChatInput
              onSubmit={handleSubmit}
              disabled={activeSession.state === 'running'}
              placeholder={activeSession.state === 'running' ? 'Claude is responding...' : 'Send a message...'}
            />
          </>
        ) : (
          <div className={styles.chatWelcome}>
            <p>Start a new Claude Code session</p>
            <button className={styles.chatStartBtn} onClick={createSession}>
              <Plus size={16} /> New Session
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

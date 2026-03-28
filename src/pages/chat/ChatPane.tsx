// ② 2026-03-27-claude-chat-phase-a-prd.md
import { useCallback, useMemo } from 'react'
import { ChatFeed } from '../../interactive-os/ui/chat/ChatFeed'
import { ChatInput } from '../../interactive-os/ui/chat/ChatInput'
import { sendMessage, useChatSession } from './chatStore'
import type { ChatMessage } from '../../interactive-os/ui/chat/types'
import styles from './PageAgentChat.module.css'

export function ChatPane({ sessionId }: { sessionId: string }) {
  const session = useChatSession(sessionId)

  const handleSubmit = useCallback((text: string) => {
    sendMessage(sessionId, text)
  }, [sessionId])

  const messages: ChatMessage[] = useMemo(() => {
    if (!session) return []
    if (!session.streamingText) return session.messages
    return [
      ...session.messages,
      {
        id: 'streaming',
        role: 'assistant' as const,
        ts: 0,
        blocks: [{ type: 'text' as const, content: session.streamingText }],
      },
    ]
  }, [session])

  if (!session) return null

  const isStreaming = session.state === 'running'

  return (
    <div className={styles.chatMain}>
      <ChatFeed
        messages={messages}
        isStreaming={isStreaming}
        streamingLabel="Thinking"
        className={styles.chatFeed}
      />
      <ChatInput
        onSubmit={handleSubmit}
        disabled={isStreaming}
        placeholder={isStreaming ? 'Claude is responding...' : 'Send a message...'}
      />
    </div>
  )
}

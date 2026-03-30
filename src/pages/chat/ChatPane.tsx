// ② 2026-03-27-claude-chat-phase-a-prd.md
import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { ChatFeed } from '../../interactive-os/ui/chat/ChatFeed'
import { Composer } from '../../interactive-os/ui/Composer'
import { ThinkingBlock } from '../../interactive-os/ui/chat/ThinkingBlock'
import { ToolSummaryBlock, ToolResultBlock } from '../../interactive-os/ui/chat/ToolSummaryBlock'
import { StreamingTextBlock } from '../../interactive-os/ui/chat/StreamingTextBlock'
import { sendMessage, clearSession, interruptSession, useChatSession } from './chatStore'
import type { ChatMessage, BlockRendererMap } from '../../interactive-os/ui/chat/types'
import styles from './PageAgentChat.module.css'

const chatRenderers: BlockRendererMap = {
  thinking: ThinkingBlock,
  tool_summary: ToolSummaryBlock,
  tool_use: ToolSummaryBlock,
  tool_result: ToolResultBlock,
  streaming_text: StreamingTextBlock,
}

const activityLabels = {
  idle: '',
  thinking: 'Thinking...',
  executing: 'Running tools...',
  streaming: 'Writing...',
} as const

function formatTokens(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}

function useElapsed(running: boolean): number {
  const [elapsed, setElapsed] = useState(0)
  const startRef = useRef(0)

  useEffect(() => {
    if (running) {
      startRef.current = Date.now()
      setElapsed(0)
      const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
      return () => clearInterval(id)
    }
  }, [running])

  return elapsed
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4)
}

export function ChatPane({ sessionId }: { sessionId: string }) {
  const session = useChatSession(sessionId)

  const handleSubmit = useCallback((text: string) => {
    if (text === '/clear') {
      clearSession(sessionId)
      return
    }
    sendMessage(sessionId, text)
  }, [sessionId])

  const handleInterrupt = useCallback(() => {
    interruptSession(sessionId)
  }, [sessionId])

  const isRunning = session?.state === 'running'
  const elapsed = useElapsed(isRunning)

  const messages: ChatMessage[] = useMemo(() => {
    if (!session) return []
    const msgs = [...session.messages]
    if (session.thinkingText) {
      msgs.push({
        id: 'thinking-live', role: 'assistant', ts: 0,
        blocks: [{ type: 'thinking', data: session.thinkingText }],
      })
    }
    if (session.streamingText) {
      msgs.push({
        id: 'streaming', role: 'assistant', ts: 0,
        blocks: [{ type: 'streaming_text', content: session.streamingText }],
      })
    }
    return msgs
  }, [session])

  if (!session) return null

  const label = activityLabels[session.activity]
  const usage = session.usage
  const liveTokens = isRunning
    ? estimateTokens(session.streamingText + session.thinkingText)
    : 0

  return (
    <div className={`flex-col flex-1 min-w-0 min-h-0 overflow-hidden ${styles.chatMain}`}>
      <ChatFeed
        messages={messages}
        blockRenderers={chatRenderers}
        isStreaming={false}
        className={`flex-1 min-h-0 ${styles.chatFeed}`}
      />
      <div className={`shrink-0 ${styles.chatComposer}`}>
        {isRunning && (
          <div className={`flex-row items-center ${styles.chatActivityBar}`}>
            <span className={styles.chatDot} />
            <span>{label}</span>
            <span>{elapsed}s</span>
            {liveTokens > 0 && <span>~{formatTokens(liveTokens)} tokens</span>}
            <button className={styles.chatStopBtn} onClick={handleInterrupt} aria-label="Stop">
              Stop
            </button>
          </div>
        )}
        <Composer
          onSubmit={handleSubmit}
          disabled={isRunning}
          placeholder="Send a message..."
        />
        <div className={styles.chatStatusBar}>
          {usage ? (
            <>
              <span>{formatTokens(usage.input)} in · {formatTokens(usage.output)} out</span>
              <span>${usage.costUsd.toFixed(4)}</span>
              <span>{(usage.durationMs / 1000).toFixed(1)}s</span>
            </>
          ) : (
            <span>claude-sonnet-4-6</span>
          )}
          <span className={styles.chatHint}>/clear to reset</span>
        </div>
      </div>
    </div>
  )
}

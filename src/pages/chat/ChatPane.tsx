// ② 2026-03-27-claude-chat-phase-a-prd.md
import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { ChatFeed } from '../../interactive-os/ui/chat/ChatFeed'
import { Composer } from '../../interactive-os/ui/Composer'
import type { ComposerHandle } from '../../interactive-os/ui/Composer'
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

// --- Slash command matching ---

const EMPTY_COMMANDS: string[] = []

function useSlashSuggestions(commands: string[], text: string, dismissed: boolean) {
  const sorted = useMemo(() => [...commands].sort(), [commands])

  const matches = useMemo(() => {
    if (dismissed || !text.startsWith('/')) return EMPTY_COMMANDS

    const firstLine = text.split('\n')[0]
    const spaceIdx = firstLine.indexOf(' ', 1)
    if (spaceIdx > 0) return EMPTY_COMMANDS // has args — no suggestions

    const typedCmd = firstLine.slice(1)
    return sorted.filter(cmd => cmd.startsWith(typedCmd) && cmd !== typedCmd)
  }, [sorted, text, dismissed])

  return matches
}

function useCommandHighlight(commands: string[], text: string) {
  const sorted = useMemo(() => [...commands].sort(), [commands])

  return useMemo(() => {
    if (!text.startsWith('/')) return 0

    const firstLine = text.split('\n')[0]
    const spaceIdx = firstLine.indexOf(' ', 1)
    const typedCmd = spaceIdx > 0 ? firstLine.slice(1, spaceIdx) : firstLine.slice(1)
    const hasArgs = spaceIdx > 0

    const match = sorted.find(cmd => cmd.startsWith(typedCmd))
    if (!match) return 0

    const isExact = typedCmd === match
    return hasArgs
      ? 1 + (isExact ? match.length : typedCmd.length)
      : 1 + typedCmd.length
  }, [sorted, text])
}

export function ChatPane({ sessionId }: { sessionId: string }) {
  const session = useChatSession(sessionId)
  const composerRef = useRef<ComposerHandle>(null)
  const [inputText, setInputText] = useState('')
  const [dismissed, setDismissed] = useState(false)
  const [selectedIdx, setSelectedIdx] = useState(0)

  const isRunning = session?.state === 'running'
  const elapsed = useElapsed(isRunning)

  const commands = session?.commands ?? EMPTY_COMMANDS
  const suggestions = useSlashSuggestions(commands, inputText, dismissed)
  const commandHighlight = useCommandHighlight(commands, inputText)

  // Ghost text = remainder of the currently selected suggestion
  const selectedCmd = suggestions[selectedIdx]
  const typedCmd = inputText.startsWith('/') ? inputText.slice(1) : ''
  const ghostText = selectedCmd ? selectedCmd.slice(typedCmd.length) : ''

  const handleSubmit = useCallback((text: string) => {
    if (text === '/clear') {
      clearSession(sessionId)
      return
    }
    sendMessage(sessionId, text)
    setInputText('')
  }, [sessionId])

  const handleInterrupt = useCallback(() => {
    interruptSession(sessionId)
  }, [sessionId])

  const handleTextChange = useCallback((text: string) => {
    setInputText(text)
    setDismissed(false)
    setSelectedIdx(0)
  }, [])

  const acceptSuggestion = useCallback(() => {
    if (!selectedCmd) return
    const newText = '/' + selectedCmd
    composerRef.current?.setText(newText)
    setInputText(newText)
    setDismissed(true)
  }, [selectedCmd])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
  }, [])

  const handleSuggestionNav = useCallback((direction: 'up' | 'down') => {
    setSelectedIdx(prev => {
      if (direction === 'down') return prev < suggestions.length - 1 ? prev + 1 : 0
      return prev > 0 ? prev - 1 : suggestions.length - 1
    })
  }, [suggestions.length])

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
          ref={composerRef}
          onSubmit={handleSubmit}
          disabled={isRunning}
          placeholder="Send a message..."
          ghostText={ghostText}
          commandHighlight={commandHighlight}
          overlayText={inputText}
          suggestions={suggestions}
          selectedSuggestion={selectedIdx}
          onGhostAccept={acceptSuggestion}
          onGhostDismiss={handleDismiss}
          onTextChange={handleTextChange}
          onSuggestionNav={handleSuggestionNav}
          onSuggestionSelect={acceptSuggestion}
        />
        <div className={styles.chatStatusBar}>
          <span>{session.model || 'connecting...'}</span>
          {usage && (
            <>
              <span>{formatTokens(usage.input)} in · {formatTokens(usage.output)} out</span>
              <span>${usage.costUsd.toFixed(4)}</span>
              <span>{(usage.durationMs / 1000).toFixed(1)}s</span>
            </>
          )}
          <span className={styles.chatHint}>/clear to reset</span>
        </div>
      </div>
    </div>
  )
}

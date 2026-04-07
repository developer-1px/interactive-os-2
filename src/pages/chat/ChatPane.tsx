// ② 2026-03-27-claude-chat-phase-a-prd.md
// @useState-hatch
import { useCallback, useMemo, useState, useEffect, useRef } from 'react'
import { ChatFeed } from '@os/ui/chat/ChatFeed'
import { Composer } from '@os/ui/Composer'
import type { ComposerHandle } from '@os/ui/Composer'
import { ThinkingBlock } from '@os/ui/chat/ThinkingBlock'
import { ToolSummaryBlock, ToolResultBlock } from '@os/ui/chat/ToolSummaryBlock'
import { StreamingTextBlock } from '@os/ui/chat/StreamingTextBlock'
import { A2UIBlock } from '@os/ui/chat/A2UIBlock'
import { sendMessage, clearSession, interruptSession, useChatSession } from './chatStore'
import type { ChatMessage, BlockRendererMap } from '@os/ui/chat/types'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import './PageAgentChat.css'

const chatRenderers: BlockRendererMap = {
  thinking: ThinkingBlock,
  tool_summary: ToolSummaryBlock,
  tool_use: ToolSummaryBlock,
  tool_result: ToolResultBlock,
  streaming_text: StreamingTextBlock,
  a2ui: A2UIBlock,
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
    if (!running) return
    startRef.current = Date.now()
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset on transition, not a cascading render
    setElapsed(0)
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000)
    return () => clearInterval(id)
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

  return useMemo(() => {
    if (dismissed || !text.startsWith('/')) return EMPTY_COMMANDS

    const firstLine = text.split('\n')[0]
    const spaceIdx = firstLine.indexOf(' ', 1)
    if (spaceIdx > 0) return EMPTY_COMMANDS

    const typedCmd = firstLine.slice(1)
    return sorted.filter(cmd => cmd.startsWith(typedCmd) && cmd !== typedCmd)
  }, [sorted, text, dismissed])
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

export function ChatPane({ sessionId, onSend }: { sessionId: string; onSend?: (sessionId: string, text: string) => void }) {
  const session = useChatSession(sessionId)
  const composerRef = useRef<ComposerHandle>(null)
  const [inputText, setInputText] = useState('')
  const [dismissed, setDismissed] = useState(false)

  const isRunning = session?.state === 'running'
  const elapsed = useElapsed(isRunning)

  const commands = session?.commands ?? EMPTY_COMMANDS
  const suggestions = useSlashSuggestions(commands, inputText, dismissed)
  const commandHighlight = useCommandHighlight(commands, inputText)

  const send = onSend ?? sendMessage
  const handleSubmit = useCallback((text: string) => {
    if (text === '/clear') {
      clearSession(sessionId)
      return
    }
    send(sessionId, text)
    setInputText('')
  }, [sessionId, send])

  const handleInterrupt = useCallback(() => {
    interruptSession(sessionId)
  }, [sessionId])

  const handleTextChange = useCallback((text: string) => {
    setInputText(text)
    setDismissed(false)
  }, [])

  const handleCommandSelect = useCallback((cmd: string) => {
    const newText = '/' + cmd
    composerRef.current?.setText(newText)
    setInputText(newText)
    setDismissed(true)
  }, [])

  const handleDismiss = useCallback(() => {
    setDismissed(true)
  }, [])

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
    <div className={ax({ layout: 'fill' })}>
      <ChatFeed
        messages={messages}
        blockRenderers={chatRenderers}
        isStreaming={false}
        className={ax({ flex: '1', padding: 'lg', scroll: 'y' })}
      />
      <div className={ax({ flex: 'none', padding: 'md', layout: 'stack', gap: 'sm' })}>
        <div className={ax({ width: 'prose', layout: 'stack', gap: 'sm' }) + ' chat-bottom-content'}>
          {isRunning && (
            <div className={ax({ layout: 'bar', gap: 'sm', textStyle: 'caption', text: 'secondary' }) + ' tabular-nums chat-activity-bar'}>
              <span className={`${ax({ surface: 'base', tone: 'accent', shape: 'pill' })} chat-dot`} />
              <span>{label}</span>
              <span>{elapsed}s</span>
              {liveTokens > 0 && <span>~{formatTokens(liveTokens)} tokens</span>}
            </div>
          )}
          <div className={ax({ layout: 'bar', gap: 'sm' }) + ' chat-input-row'}>
            <Composer
              ref={composerRef}
              onSubmit={handleSubmit}
              disabled={isRunning}
              placeholder="Send a message..."
              commandHighlight={commandHighlight}
              overlayText={inputText}
              suggestions={suggestions}
              onCommandSelect={handleCommandSelect}
              onDismiss={handleDismiss}
              onTextChange={handleTextChange}
            />
            {isRunning && (
              <button className={ax({ surface: 'ghost', layout: 'center', controlSize: 'md', tone: 'danger' })} onClick={handleInterrupt} aria-label="Stop">
                <svg width="10" height="10" viewBox="0 0 10 10" fill="currentColor">
                  <rect width="10" height="10" rx="2" />
                </svg>
              </button>
            )}
          </div>
          <div className={ax({ layout: 'bar', gap: 'md', textStyle: 'caption', text: 'muted' }) + ' tabular-nums chat-status-bar'}>
            <span className={ax({ text: 'secondary' })}>{session.model || 'connecting...'}</span>
            {usage && (
              <>
                <span>{formatTokens(usage.input)} in · {formatTokens(usage.output)} out</span>
                <span>${usage.costUsd.toFixed(4)}</span>
                <span>{(usage.durationMs / 1000).toFixed(1)}s</span>
              </>
            )}
            <span className={ax({ textStyle: 'code' }) + ' chat-hint'}>/clear to reset</span>
          </div>
        </div>
      </div>
    </div>
  )
}

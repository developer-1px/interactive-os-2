// ② 2026-04-01-session-replay-phase-a-prd.md
import { useState, useEffect, useCallback } from 'react'
import { ChatFeed } from '../../interactive-os/ui/chat/ChatFeed'
import { ThinkingBlock } from '../../interactive-os/ui/chat/ThinkingBlock'
import { ToolSummaryBlock, ToolResultBlock } from '../../interactive-os/ui/chat/ToolSummaryBlock'
import type { ChatMessage, BlockRendererMap } from '../../interactive-os/ui/chat/types'
import { useAnimationQueue } from '../../interactive-os/ui/useAnimationQueue'
import { chatReducer, toReplayDeltas, type TimedDelta } from './replayDelta'

const chatRenderers: BlockRendererMap = {
  thinking: ThinkingBlock,
  tool_summary: ToolSummaryBlock,
  tool_use: ToolSummaryBlock,
  tool_result: ToolResultBlock,
}

interface SessionFile {
  id: string
  model: string
  messages: ChatMessage[]
}

const sessionLoaders = import.meta.glob<SessionFile>('./sessions/*.json', { import: 'default' })

const sessionIds = Object.keys(sessionLoaders).map(path => {
  const match = path.match(/\/([^/]+)\.json$/)
  return match?.[1] ?? path
})

export default function PageReplay() {
  const [selectedId, setSelectedId] = useState(sessionIds[0] ?? '')
  const [allMessages, setAllMessages] = useState<ChatMessage[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])

  const onRelease = useCallback((td: TimedDelta) => {
    setMessages(prev => chatReducer(prev, td.delta))
  }, [])

  const getDelay = useCallback((td: TimedDelta) => td.delay, [])

  const { enqueueAll, clear, isRunning } = useAnimationQueue<TimedDelta>({
    onRelease,
    getDelay,
  })

  useEffect(() => {
    let cancelled = false
    async function load() {
      const path = `./sessions/${selectedId}.json`
      const loader = sessionLoaders[path]
      if (!loader) return
      const session = await loader()
      if (!cancelled) setAllMessages(session.messages)
    }
    if (selectedId) load()
    return () => { cancelled = true }
  }, [selectedId])

  const startReplay = useCallback(() => {
    clear()
    setMessages([])
    if (allMessages.length > 0) {
      const deltas = toReplayDeltas(allMessages)
      enqueueAll(deltas)
    }
  }, [allMessages, enqueueAll, clear])

  // Auto-start when session data arrives
  const prevAllRef = useCallback((msgs: ChatMessage[]) => {
    if (msgs.length > 0) startReplay()
  }, [startReplay])

  // eslint-disable-next-line react-hooks/exhaustive-deps -- trigger replay on data load
  useEffect(() => { prevAllRef(allMessages) }, [allMessages])

  return (
    <div className="flex-col" style={{ height: '100%' }}>
      <div className="flex-row items-center" style={{ padding: 'var(--space-2) var(--space-3)', gap: 'var(--space-2)' }}>
        <select
          value={selectedId}
          onChange={e => setSelectedId(e.target.value)}
          style={{ fontSize: 'var(--font-size-1)' }}
        >
          {sessionIds.map(id => (
            <option key={id} value={id}>{id}</option>
          ))}
        </select>
        {!isRunning && messages.length > 0 && (
          <button onClick={startReplay} style={{ cursor: 'pointer', fontSize: 'var(--font-size-1)' }}>
            Replay
          </button>
        )}
      </div>
      <ChatFeed
        messages={messages}
        blockRenderers={chatRenderers}
        isStreaming={isRunning}
        className="flex-1 min-h-0"
      />
    </div>
  )
}

// ② 2026-03-27-chat-module-prd.md
import { memo, useMemo, type ReactNode } from 'react'
import { StreamFeed } from '../StreamFeed'
import { useStreamFeed } from '../useStreamFeed'
import { FallbackBlock } from './FallbackBlock'
import { TextBlock } from './TextBlock'
import { ChatCodeBlock } from './ChatCodeBlock'
import { DiffBlock } from './DiffBlock'
import type { ChatMessage, ChatBlock, BlockRendererMap } from './types'
import styles from './ChatFeed.module.css'

// --- Default renderers (implementation set A: text/code/diff) ---

const defaultRenderers: BlockRendererMap = {
  text: TextBlock,
  code: ChatCodeBlock,
  diff: DiffBlock,
}

// --- Props ---

export interface ChatFeedProps {
  messages: ChatMessage[]
  blockRenderers?: BlockRendererMap
  isStreaming?: boolean
  streamingLabel?: string
  className?: string
}

// --- Message bubble (memoized) ---

const MessageBubble = memo(function MessageBubble({
  message,
  renderers,
}: {
  message: ChatMessage
  renderers: BlockRendererMap
}) {
  const roleClass = message.role === 'user' ? styles.chatUser : styles.chatAssistant

  return (
    <div className={`${styles.chatMessage} ${roleClass}`}>
      {message.blocks.map((block, i) => (
        <BlockDispatch key={i} block={block} renderers={renderers} />
      ))}
    </div>
  )
})

// --- Block dispatch (Record lookup, no switch-case — F1 compliance) ---

function BlockDispatch({ block, renderers }: { block: ChatBlock; renderers: BlockRendererMap }) {
  const Renderer = renderers[block.type] ?? FallbackBlock
  return <Renderer block={block} />
}

// --- ChatFeed ---

export function ChatFeed({
  messages,
  blockRenderers,
  isStreaming,
  streamingLabel,
  className,
}: ChatFeedProps) {
  const mergedRenderers = useMemo(
    () => blockRenderers ? { ...defaultRenderers, ...blockRenderers } : defaultRenderers,
    [blockRenderers],
  )

  const { feedRef } = useStreamFeed<ChatMessage>()

  return (
    <StreamFeed
      items={messages}
      feedRef={feedRef}
      isStreaming={isStreaming}
      streamingLabel={streamingLabel}
      className={className}
      renderItem={(message: ChatMessage, _i: number, _meta: { isLatest: boolean }): ReactNode => (
        <MessageBubble message={message} renderers={mergedRenderers} />
      )}
    />
  )
}

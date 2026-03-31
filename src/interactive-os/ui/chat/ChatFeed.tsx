// ② 2026-03-27-chat-module-prd.md
import { memo, useEffect, useMemo, type ReactNode } from 'react'
import { StreamFeed } from '../StreamFeed'
import { useStreamFeed } from '../useStreamFeed'
import { FallbackBlock } from './FallbackBlock'
import { TextBlock } from './TextBlock'
import { ChatCodeBlock } from './ChatCodeBlock'
import { DiffBlock } from './DiffBlock'
import { ToolGroup } from './ToolSummaryBlock'
import type { ChatMessage, ChatBlock, DataBlock, BlockRendererMap } from './types'
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

// --- Group tool_use + tool_result pairs from system messages ---

type GroupedBlock =
  | { kind: 'single'; block: ChatBlock }
  | { kind: 'tool_group'; toolUse: DataBlock; toolResult?: DataBlock }

function groupSystemBlocks(blocks: ChatBlock[]): GroupedBlock[] {
  const uses: DataBlock[] = []
  const results: DataBlock[] = []
  const others: ChatBlock[] = []

  for (const block of blocks) {
    if (block.type === 'tool_use') uses.push(block as DataBlock)
    else if (block.type === 'tool_result') results.push(block as DataBlock)
    else others.push(block)
  }

  const groups: GroupedBlock[] = []

  // Pair tool_use[i] with result[i]
  for (let i = 0; i < uses.length; i++) {
    groups.push({ kind: 'tool_group', toolUse: uses[i], toolResult: results[i] })
  }

  // Orphan results (more results than uses)
  for (let i = uses.length; i < results.length; i++) {
    groups.push({ kind: 'single', block: results[i] })
  }

  // Other blocks
  for (const block of others) {
    groups.push({ kind: 'single', block })
  }

  return groups
}

// --- Message bubble (memoized) ---

const MessageBubble = memo(function MessageBubble({
  message,
  renderers,
}: {
  message: ChatMessage
  renderers: BlockRendererMap
}) {
  const roleClass = message.role === 'user'
    ? styles.chatUser
    : message.role === 'system'
      ? `overflow-hidden ${styles.chatSystem}`
      : styles.chatAssistant

  // System messages: group tool_use + tool_result pairs
  if (message.role === 'system') {
    const groups = groupSystemBlocks(message.blocks)
    return (
      <div className={`flex-col ${styles.chatMessage} ${roleClass}`}>
        {groups.map((g, i) =>
          g.kind === 'tool_group'
            ? <ToolGroup key={i} toolUse={g.toolUse} toolResult={g.toolResult} />
            : <BlockDispatch key={i} block={g.block} renderers={renderers} />
        )}
      </div>
    )
  }

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

  const { feedRef, scrollIfAtBottom } = useStreamFeed<ChatMessage>()

  // Auto-scroll on external message changes — delegated to useStreamFeed
  useEffect(() => { scrollIfAtBottom() }, [messages, scrollIfAtBottom])

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

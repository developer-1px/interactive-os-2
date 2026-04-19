// ② 2026-03-27-chat-module-prd.md
import { memo, useMemo, useRef, type ReactNode } from 'react'
import { StreamFeed } from '../StreamFeed'
import './ChatFeed.css'
import { FallbackBlock } from './FallbackBlock'
import { TextBlock } from './TextBlock'
import { ChatCodeBlock } from './ChatCodeBlock'
import { DiffBlock } from './DiffBlock'
import { ToolGroup, ToolChainGroup } from './ToolSummaryBlock'
import { ChatFeaturesOverride } from './chatFeatures'
import type { ChatMessage, ChatBlock, DataBlock, BlockRendererMap } from './types'
import { useAutoscroll } from '../../plugins/autoscroll'
import { ax } from '@styles/ax'


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

// --- Merge consecutive system messages before rendering ---

function mergeConsecutiveSystem(messages: ChatMessage[]): ChatMessage[] {
  const merged: ChatMessage[] = []
  for (const msg of messages) {
    const prev = merged[merged.length - 1]
    if (msg.role === 'system' && prev?.role === 'system') {
      merged[merged.length - 1] = {
        ...prev,
        blocks: [...prev.blocks, ...msg.blocks],
      }
    } else {
      merged.push(msg)
    }
  }
  return merged
}

// --- Group tool_use + tool_result pairs, then classify into 3 tiers ---

interface ToolPair { toolUse: DataBlock; toolResult?: DataBlock }

type GroupedBlock =
  | { kind: 'single'; block: ChatBlock }
  | { kind: 'output'; pair: ToolPair }
  | { kind: 'tool_chain'; pairs: ToolPair[] }

const OUTPUT_TOOLS = new Set(['Write', 'Edit'])

function getToolName(block: DataBlock): string {
  const data = block.data as { name?: string } | string
  return typeof data === 'string' ? data : (data.name ?? 'tool')
}

function groupSystemBlocks(blocks: ChatBlock[]): GroupedBlock[] {
  const uses: DataBlock[] = []
  const results: DataBlock[] = []
  const others: ChatBlock[] = []

  for (const block of blocks) {
    if (block.type === 'tool_use') uses.push(block as DataBlock)
    else if (block.type === 'tool_result') results.push(block as DataBlock)
    else others.push(block)
  }

  const pairs: ToolPair[] = uses.map((u, i) => ({ toolUse: u, toolResult: results[i] }))

  const groups: GroupedBlock[] = []
  const chainBuffer: ToolPair[] = []

  function flushChain() {
    if (chainBuffer.length > 0) {
      groups.push({ kind: 'tool_chain', pairs: [...chainBuffer] })
      chainBuffer.length = 0
    }
  }

  for (const pair of pairs) {
    if (OUTPUT_TOOLS.has(getToolName(pair.toolUse))) {
      flushChain()
      groups.push({ kind: 'output', pair })
    } else {
      chainBuffer.push(pair)
    }
  }
  flushChain()

  for (let i = uses.length; i < results.length; i++) {
    groups.push({ kind: 'single', block: results[i] })
  }

  for (const block of others) {
    groups.push({ kind: 'single', block })
  }

  return groups
}

// --- Message bubble (memoized, pure — no timers, no scroll) ---

const MessageBubble = memo(function MessageBubble({
  message,
  renderers,
}: {
  message: ChatMessage
  renderers: BlockRendererMap
}) {
  const roleClass = message.role === 'user'
    ? `${ax({ role: 'cell', textStyle: 'body', content: 'bubble', surface: 'display', tone: 'accent-dim' })} chat-user`
    : message.role === 'system'
      ? `${ax({ textStyle: 'caption' })} chat-system`
      : `${ax({ textStyle: 'body' })} chat-assistant`

  if (message.role === 'system') {
    const groups = groupSystemBlocks(message.blocks)
    return (
      <div className={`${ax({ layout: 'stack' })} ${roleClass}`}>
        {groups.map((g, i) => {
          if (g.kind === 'tool_chain') return <ToolChainGroup key={i} pairs={g.pairs} />
          if (g.kind === 'output') return <ToolGroup key={i} toolUse={g.pair.toolUse} toolResult={g.pair.toolResult} />
          return <BlockDispatch key={i} block={g.block} renderers={renderers} />
        })}
      </div>
    )
  }

  return (
    <div className={`${ax({ })} ${roleClass}`}>
      {message.blocks.map((block, i) => (
        <BlockDispatch key={i} block={block} renderers={renderers} />
      ))}
    </div>
  )
})

// --- Block dispatch ---

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

  const merged = useMemo(() => mergeConsecutiveSystem(messages), [messages])
  const feedRef = useRef<HTMLDivElement | null>(null)

  useAutoscroll(feedRef)

  return (
    <StreamFeed
      items={merged}
      feedRef={feedRef}
      isStreaming={isStreaming}
      streamingLabel={streamingLabel}
      className={className}
      renderItem={(message: ChatMessage, _i: number, meta: { isLatest: boolean }): ReactNode => (
        <ChatFeaturesOverride.Provider value={meta.isLatest ? { isLatest: true } : { expandByDefault: false, isLatest: false }}>
          <MessageBubble message={message} renderers={mergedRenderers} />
        </ChatFeaturesOverride.Provider>
      )}
    />
  )
}

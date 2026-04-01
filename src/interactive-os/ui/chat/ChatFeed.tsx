// ② 2026-03-27-chat-module-prd.md
import { memo, useEffect, useMemo, useRef, type ReactNode } from 'react'
import { StreamFeed } from '../StreamFeed'
import { FallbackBlock } from './FallbackBlock'
import { TextBlock } from './TextBlock'
import { ChatCodeBlock } from './ChatCodeBlock'
import { DiffBlock } from './DiffBlock'
import { ToolGroup, ToolChainGroup } from './ToolSummaryBlock'
import { ChatFeaturesOverride } from './chatFeatures'
import type { ChatMessage, ChatBlock, DataBlock, BlockRendererMap } from './types'
import { ax } from '../../../poc/ax'
import '../../../poc/ax.css'
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
    ? styles.chatUser
    : message.role === 'system'
      ? styles.chatSystem
      : styles.chatAssistant

  if (message.role === 'system') {
    const groups = groupSystemBlocks(message.blocks)
    return (
      <div className={`${ax({ layout: 'column' })} ${styles.chatMessage} ${roleClass}`}>
        {groups.map((g, i) => {
          if (g.kind === 'tool_chain') return <ToolChainGroup key={i} pairs={g.pairs} />
          if (g.kind === 'output') return <ToolGroup key={i} toolUse={g.pair.toolUse} toolResult={g.pair.toolResult} />
          return <BlockDispatch key={i} block={g.block} renderers={renderers} />
        })}
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

// --- Block dispatch ---

function BlockDispatch({ block, renderers }: { block: ChatBlock; renderers: BlockRendererMap }) {
  const Renderer = renderers[block.type] ?? FallbackBlock
  return <Renderer block={block} />
}

// --- Scroll controller (single source of truth) ---

function useScrollController(
  feedRef: React.RefObject<HTMLDivElement | null>,
  merged: ChatMessage[],
) {
  const prevCountRef = useRef(merged.length)
  const userScrolledUpRef = useRef(false)
  const rafRef = useRef(0)

  // Wheel → immediately disable auto-scroll & cancel pending scroll
  useEffect(() => {
    const el = feedRef.current
    if (!el) return
    const onWheel = () => {
      userScrolledUpRef.current = true
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = 0 }
    }
    const onScroll = () => {
      const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight <= 40
      if (nearBottom) userScrolledUpRef.current = false
    }
    el.addEventListener('wheel', onWheel, { passive: true })
    el.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      el.removeEventListener('wheel', onWheel)
      el.removeEventListener('scroll', onScroll)
    }
  }, [feedRef])

  // React to message changes
  useEffect(() => {
    const prevCount = prevCountRef.current
    prevCountRef.current = merged.length
    if (merged.length <= prevCount) return

    const feed = feedRef.current
    if (!feed) return

    const newMsg = merged[prevCount]

    // User message → scroll to top of that message
    if (newMsg?.role === 'user') {
      const entries = feed.querySelectorAll('[data-feed-entry]')
      const entry = entries[entries.length - 1] as HTMLElement | undefined
      if (entry) {
        requestAnimationFrame(() => {
          entry.scrollIntoView({ behavior: 'smooth', block: 'start' })
        })
      }
      userScrolledUpRef.current = false
      return
    }

    // Other messages: scroll if user hasn't scrolled up
    if (userScrolledUpRef.current) return

    if (rafRef.current) cancelAnimationFrame(rafRef.current)
    rafRef.current = requestAnimationFrame(() => {
      // Scroll so latest content sits ~40% from top
      const entries = feed.querySelectorAll('[data-feed-entry]')
      const lastEntry = entries[entries.length - 1] as HTMLElement | undefined
      if (!lastEntry) return
      const rect = lastEntry.getBoundingClientRect()
      const feedRect = feed.getBoundingClientRect()
      if (rect.bottom < feedRect.bottom) return // still visible
      const targetFromTop = feedRect.height * 0.4
      const scrollBy = rect.bottom - feedRect.top - targetFromTop
      feed.scrollBy({ top: scrollBy, behavior: 'smooth' })
      rafRef.current = 0
    })
  }, [merged, feedRef])

  // Cleanup
  useEffect(() => {
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current) }
  }, [])
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

  useScrollController(feedRef, merged)

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

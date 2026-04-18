var e=`// ② 2026-04-01-session-replay-phase-a-prd.md
import type { ChatMessage, TextBlock } from '@os/ui/chat/types'

// --- ChatDelta: atomic state change ---

export type ChatDelta =
  | { type: 'add-message'; message: ChatMessage }
  | { type: 'append-text'; msgId: string; blockIdx: number; text: string }

// --- Reducer: (state, delta) → newState ---

export function chatReducer(state: ChatMessage[], delta: ChatDelta): ChatMessage[] {
  switch (delta.type) {
    case 'add-message':
      return [...state, delta.message]
    case 'append-text':
      return state.map(msg => {
        if (msg.id !== delta.msgId) return msg
        const blocks = msg.blocks.map((b, i) => {
          if (i !== delta.blockIdx || b.type !== 'text') return b
          return { ...b, content: (b as TextBlock).content + delta.text }
        })
        return { ...msg, blocks }
      })
  }
}

// --- Split text at sentence/paragraph boundaries ---

function splitChunks(text: string): string[] {
  const re = /[.!?。！？]\\s|\\n\\n|\\n[-*] |\\n#{1,6} /g
  const chunks: string[] = []
  let last = 0
  let match: RegExpExecArray | null
  while ((match = re.exec(text)) !== null) {
    const end = match[0].startsWith('\\n') && match[0].length > 1
      ? match.index + 1
      : match.index + match[0].length
    if (end > last) chunks.push(text.slice(last, end))
    last = end
  }
  if (last < text.length) chunks.push(text.slice(last))
  return chunks
}

// --- Timing constants ---

const SENTENCE_PACE_MS = 200
const PRE_USER_PAUSE = 1500
const MIN_DELAY = 300

// --- Preprocess: JSON messages → delta[] with timing ---

export interface TimedDelta {
  delta: ChatDelta
  delay: number
}

export function toReplayDeltas(messages: ChatMessage[]): TimedDelta[] {
  const result: TimedDelta[] = []

  for (const msg of messages) {
    // User messages: pause before, then instant
    if (msg.role === 'user') {
      result.push({ delta: { type: 'add-message', message: msg }, delay: PRE_USER_PAUSE })
      continue
    }

    // Assistant text: split into sentence-level deltas
    if (msg.role === 'assistant') {
      const textBlockIdx = msg.blocks.findIndex(b => b.type === 'text')
      if (textBlockIdx >= 0) {
        const textBlock = msg.blocks[textBlockIdx] as TextBlock
        const chunks = splitChunks(textBlock.content)

        if (chunks.length > 1) {
          // Add message with empty text first
          const emptyMsg: ChatMessage = {
            ...msg,
            blocks: msg.blocks.map((b, i) =>
              i === textBlockIdx ? { ...b, content: '' } : b
            ),
          }
          result.push({ delta: { type: 'add-message', message: emptyMsg }, delay: MIN_DELAY })

          // Append each chunk
          for (const chunk of chunks) {
            result.push({
              delta: { type: 'append-text', msgId: msg.id, blockIdx: textBlockIdx, text: chunk },
              delay: SENTENCE_PACE_MS,
            })
          }
          continue
        }
      }

      // Assistant with no text (thinking-only) or single chunk: add as-is
      result.push({ delta: { type: 'add-message', message: msg }, delay: MIN_DELAY })
      continue
    }

    // System/other: add as-is
    result.push({ delta: { type: 'add-message', message: msg }, delay: MIN_DELAY })
  }

  return result
}
`;export{e as default};
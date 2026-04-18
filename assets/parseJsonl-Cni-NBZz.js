var e=`// ② 2026-04-03-session-replay-phase-b-prd.md
import type { ChatMessage } from '@os/ui/chat/types'

// --- JSONL entry types (Claude Code format) ---

interface JsonlEntry {
  message: {
    role: 'user' | 'assistant'
    content: string | JsonlContentBlock[]
    model?: string
  }
  timestamp?: string
  uuid?: string
  parentUuid?: string
  isSidechain?: boolean
  sessionId?: string
}

type JsonlContentBlock =
  | { type: 'text'; text: string }
  | { type: 'thinking'; thinking: string }
  | { type: 'tool_use'; id: string; name: string; input: Record<string, unknown> }
  | { type: 'tool_result'; tool_use_id: string; content: string; is_error?: boolean }

// --- Public API ---

export interface ParsedSession {
  model: string
  messages: ChatMessage[]
}

/**
 * Parse JSONL text → ChatMessage[]. Skips malformed lines.
 * @invariant I4 — \`sidechainOnly: true\` 시 반환 messages는 모두 isSidechain=true 엔트리 기반
 * @invariant 기본(\`sidechainOnly\` 미지정 또는 false) = 메인 세션만(isSidechain=true 스킵). 기존 호출부 동작 불변
 */
export function parseJsonl(
  text: string,
  options?: { sidechainOnly?: boolean },
): ParsedSession {
  const sidechainOnly = options?.sidechainOnly === true
  const lines = text.split('\\n').filter(Boolean)
  const messages: ChatMessage[] = []
  let model = ''
  let msgCounter = 0

  // Pending tool_use blocks waiting for their results
  const pendingTools: Map<string, { toolBlock: JsonlContentBlock; msgId: string; blockIdx: number }> = new Map()
  // Current system message being built (groups tool_use + tool_result pairs)
  let currentSystemMsg: ChatMessage | null = null

  function flushSystem() {
    if (currentSystemMsg && currentSystemMsg.blocks.length > 0) {
      messages.push(currentSystemMsg)
      currentSystemMsg = null
    }
  }

  for (const line of lines) {
    let entry: JsonlEntry
    try {
      entry = JSON.parse(line)
    } catch {
      continue // skip malformed
    }

    // I4: sidechain filter — sidechainOnly true면 isSidechain !== true 스킵, false면 isSidechain === true 스킵
    const isSide = entry.isSidechain === true
    if (sidechainOnly ? !isSide : isSide) continue

    const msg = entry.message
    if (!msg?.role) continue
    if (!model && msg.model) model = msg.model

    const content = msg.content
    const ts = entry.timestamp ? new Date(entry.timestamp).getTime() : Date.now()

    // User message (plain text prompt)
    if (msg.role === 'user' && typeof content === 'string') {
      flushSystem()
      messages.push({
        id: \`user-\${++msgCounter}\`,
        role: 'user',
        ts,
        blocks: [{ type: 'text', content }],
      })
      continue
    }

    // User message with tool_results
    if (msg.role === 'user' && Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'tool_result') {
          const pending = pendingTools.get(block.tool_use_id)
          if (pending && currentSystemMsg) {
            // Add result to the same system message
            currentSystemMsg.blocks.push({
              type: 'tool_result',
              data: block.content ?? '',
            })
          }
          pendingTools.delete(block.tool_use_id)
        }
      }
      continue
    }

    // Assistant message
    if (msg.role === 'assistant' && Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'text' && 'text' in block) {
          flushSystem()
          messages.push({
            id: \`assistant-\${++msgCounter}\`,
            role: 'assistant',
            ts,
            blocks: [{ type: 'text', content: block.text }],
          })
        } else if (block.type === 'thinking' && 'thinking' in block) {
          flushSystem()
          messages.push({
            id: \`thinking-\${++msgCounter}\`,
            role: 'assistant',
            ts,
            blocks: [{ type: 'thinking', data: block.thinking }],
          })
        } else if (block.type === 'tool_use' && 'name' in block) {
          // Start or continue a system message for tool groups
          if (!currentSystemMsg) {
            currentSystemMsg = {
              id: \`tools-\${++msgCounter}\`,
              role: 'system',
              ts,
              blocks: [],
            }
          }
          currentSystemMsg.blocks.push({
            type: 'tool_use',
            data: { name: block.name, input: block.input },
          })
          pendingTools.set(block.id, {
            toolBlock: block,
            msgId: currentSystemMsg.id,
            blockIdx: currentSystemMsg.blocks.length - 1,
          })
        }
      }
      continue
    }
  }

  flushSystem()
  return { model: model || 'unknown', messages }
}

// --- Tool data extraction for ToolPreview ---

export interface ToolStep {
  index: number
  tool: string
  input: Record<string, unknown>
  result: string | null
  filePath: string | null
}

/** Extract ordered tool steps from parsed messages. */
export function extractToolSteps(messages: ChatMessage[]): ToolStep[] {
  const steps: ToolStep[] = []
  let index = 0

  for (const msg of messages) {
    if (msg.role !== 'system') continue
    for (let i = 0; i < msg.blocks.length; i++) {
      const block = msg.blocks[i]
      if (block.type === 'tool_use' && 'data' in block) {
        const data = block.data as { name: string; input: Record<string, unknown> }
        // Look for matching tool_result (next block)
        const nextBlock = msg.blocks[i + 1]
        const result = nextBlock?.type === 'tool_result' && 'data' in nextBlock
          ? String(nextBlock.data)
          : null

        const filePath = (data.input.file_path as string)
          ?? (data.input.path as string)
          ?? null

        steps.push({ index: index++, tool: data.name, input: data.input, result, filePath })
      }
    }
  }

  return steps
}
`;export{e as default};
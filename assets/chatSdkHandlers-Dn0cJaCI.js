var e=`import type { ChatMessage } from '@os/ui/chat/types'
import type { ChatSession } from './chatStore'

export type SdkMsg = { type: string; [k: string]: unknown }

export function createSdkHandlers(ctx: {
  sessions: Map<string, ChatSession>
  patch(id: string, p: Partial<ChatSession>): void
  pushMessage(id: string, msg: ChatMessage, extra?: Partial<ChatSession>): void
  makeMsg(role: ChatMessage['role'], content: string): ChatMessage
  commitAccumulated(s: ChatSession): ChatMessage[]
  notify(): void
}): Record<string, (id: string, msg: SdkMsg) => void> {
  const { sessions, patch, pushMessage, makeMsg, commitAccumulated, notify } = ctx

  return {
    stream_event(id, msg) {
      const evt = msg.event as {
        type: string
        content_block?: { type: string; name?: string }
        delta?: { type: string; text?: string; thinking?: string }
      } | undefined
      if (!evt) return

      if (evt.type === 'content_block_start' && evt.content_block?.type === 'tool_use') {
        patch(id, { activity: 'executing' })
        return
      }

      if (evt.type !== 'content_block_delta' || !evt.delta) return
      const { delta } = evt
      if (delta.type === 'text_delta' && delta.text) {
        const s = sessions.get(id)
        if (s) patch(id, { activity: 'streaming', streamingText: s.streamingText + delta.text })
      }
      if (delta.type === 'thinking_delta' && delta.thinking) {
        const s = sessions.get(id)
        if (s) patch(id, { activity: 'thinking', thinkingText: s.thinkingText + delta.thinking })
      }
    },

    assistant(id, msg) {
      const s = sessions.get(id)
      if (!s) return

      const newMessages: ChatMessage[] = commitAccumulated(s)

      const content = (msg.message as { content?: { type: string; name?: string; input?: unknown; text?: string }[] } | undefined)?.content
      if (content) {
        const toolBlocks = content.filter(b => b.type === 'tool_use')
        if (toolBlocks.length > 0) {
          newMessages.push({
            id: \`tools-\${Date.now()}\`, role: 'system' as const, ts: Date.now(),
            blocks: toolBlocks.map(b => ({
              type: 'tool_use' as const,
              data: { name: b.name, input: b.input },
            })),
          })
        }

        // Fallback: SDK may not stream text, extract from committed content
        if (!s.streamingText) {
          const text = content.filter(b => b.type === 'text' && b.text).map(b => b.text).join('')
          if (text) newMessages.push(makeMsg('assistant', text))
        }
      }

      // Agent loop: tool_use means more turns coming
      const hasToolUse = newMessages.some(m => m.blocks.some(b => b.type === 'tool_use'))
      const nextState = hasToolUse
        ? { state: 'running' as const, activity: 'executing' as const }
        : { state: 'idle' as const, activity: 'idle' as const }

      if (newMessages.length > 0) {
        sessions.set(id, {
          ...s,
          ...nextState, streamingText: '', thinkingText: '',
          messages: [...s.messages, ...newMessages],
        })
        notify()
      } else {
        patch(id, { ...nextState, streamingText: '', thinkingText: '' })
      }
    },

    // SDK echoes user messages back — contains tool_result → append to last tool message
    user(id, msg) {
      const content = (msg.message as { content?: unknown } | undefined)?.content
      if (!Array.isArray(content)) return
      const results = content.filter((b: { type?: string }) => b.type === 'tool_result')
      if (results.length === 0) return

      const s = sessions.get(id)
      if (!s) return

      const resultBlocks = results.map((b: { content?: unknown }) => ({
        type: 'tool_result' as const,
        data: b.content,
      }))

      const msgs = [...s.messages]
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'system' && msgs[i].blocks.some(b => b.type === 'tool_use')) {
          msgs[i] = { ...msgs[i], blocks: [...msgs[i].blocks, ...resultBlocks] }
          sessions.set(id, { ...s, messages: msgs })
          notify()
          return
        }
      }

      // Fallback: no matching tool message found, push as separate
      pushMessage(id, {
        id: \`result-\${Date.now()}\`, role: 'system' as const, ts: Date.now(),
        blocks: resultBlocks,
      })
    },

    tool_progress(id, _msg) {
      patch(id, { activity: 'executing' })
    },

    tool_use_summary(id, msg) {
      const summary = (msg.summary as string) ?? ''
      if (summary) {
        pushMessage(id, {
          id: \`tool-\${Date.now()}\`, role: 'system', ts: Date.now(),
          blocks: [{ type: 'tool_summary', data: summary }],
        }, { activity: 'executing' })
      }
    },

    result(id, msg) {
      const usage = msg.usage as { input_tokens?: number; output_tokens?: number } | undefined
      patch(id, {
        state: 'idle', activity: 'idle',
        usage: {
          input: usage?.input_tokens ?? 0,
          output: usage?.output_tokens ?? 0,
          costUsd: (msg.total_cost_usd as number) ?? 0,
          durationMs: (msg.duration_ms as number) ?? 0,
        },
      })
    },

    system(id, msg) {
      if (msg.subtype === 'init' && msg.model) {
        patch(id, { model: msg.model as string })
      }
      if (msg.subtype === 'session_state_changed') {
        patch(id, { state: msg.state as ChatSession['state'] })
      }
    },
  }
}
`;export{e as default};
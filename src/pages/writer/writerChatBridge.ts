// ② 2026-04-04-writer-chat-prd.md
import { useEffect, useRef } from 'react'
import { writerState } from './writerStore'
import { useChatSession, createSession, sendMessage as chatSendMessage, hasSession } from '../chat/chatStore'
import { extractAnalysis, type AnalysisResult } from './writerAnalyze'

const WRITER_SESSIONS_KEY = 'writer-chat-sessions'

function loadSessionMap(): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(WRITER_SESSIONS_KEY) ?? '{}')
  } catch { return {} }
}

function saveSessionMap(map: Record<string, string>) {
  localStorage.setItem(WRITER_SESSIONS_KEY, JSON.stringify(map))
}

/** Get or create a persistent chat session for a specific file (or 'default' for no-file). */
export function getSessionForFile(filePath: string | undefined): string {
  const key = filePath ?? '__default__'
  const map = loadSessionMap()
  if (map[key] && hasSession(map[key])) return map[key]
  const id = createSession()
  map[key] = id
  saveSessionMap(map)
  return id
}

const MD_FENCE_RE = /```markdown\n([\s\S]*?)```/g

/** Extract the last ```markdown``` fenced block from text. */
export function extractMdBlock(text: string): string | null {
  let last: string | null = null
  for (const m of text.matchAll(MD_FENCE_RE)) {
    last = m[1]
  }
  return last !== null ? last.trimEnd() : null
}

/** Build a system-context prefix with the current MD content. */
function buildContext(): string {
  const md = writerState.getMd()
  const filePath = writerState.getFilePath()
  const header = filePath ? `Current file: ${filePath}` : 'No file open'

  if (!md) return `[${header} — empty document]\n\n`

  return `[${header}]\n\`\`\`markdown\n${md}\n\`\`\`\n\n`
}

/** Send a message with writer context prepended. */
export function sendWriterMessage(sessionId: string, text: string) {
  const contextual = buildContext() + text
  chatSendMessage(sessionId, contextual)
}

/**
 * Hook: watches a chat session for new assistant messages containing
 * ```markdown blocks and applies them to writerState.
 */
export function useWriterChatSync(sessionId: string | null, onAnalysis?: (result: AnalysisResult) => void) {
  const session = useChatSession(sessionId ?? '')
  const lastCountRef = useRef(0)

  useEffect(() => {
    if (!session) return
    const msgs = session.messages
    if (msgs.length <= lastCountRef.current) {
      lastCountRef.current = msgs.length
      return
    }

    // Check only new messages
    for (let i = lastCountRef.current; i < msgs.length; i++) {
      const msg = msgs[i]
      if (msg.role !== 'assistant') continue
      for (const block of msg.blocks) {
        if ('content' in block && typeof block.content === 'string') {
          const md = extractMdBlock(block.content)
          if (md !== null) {
            writerState.setMd(md)
          }
          const analysis = extractAnalysis(block.content)
          if (analysis && onAnalysis) {
            onAnalysis(analysis)
          }
        }
      }
    }
    lastCountRef.current = msgs.length
  }, [session, session?.messages.length, onAnalysis])
}

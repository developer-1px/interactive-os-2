// ② replayV2BeatPrd
import type { ChatMessage, ChatBlock } from '@os/ui/chat/types'
import type { Beat, BeatSession, CommitBeat, DiffBeat, TerminalBeat, ThinkingBeat } from './beatTypes'
import { parseCommitMessage } from './parseCommitMessage'

export interface ToBeatsArgs {
  sessionId: string
  agent: BeatSession['agent']
  title: string
  repo: string
  messages: ChatMessage[]
}

interface EditStats {
  edits: number
  additions: number
  deletions: number
}

/**
 * 변환 규칙:
 * - assistant text block → ThinkingBeat (1 메시지 1 beat)
 * - tool_use Bash → TerminalBeat (input.command + tool_result lines)
 * - tool_use Edit/Write → DiffBeat (old/new 라인화 + ctx 일부)
 * - tool_use Read/Grep/Glob → ThinkingBeat에 흡수 또는 skip (포스터로 약함)
 * - 마지막에 CommitBeat 1개 합성 (parseCommitMessage(첫 user prompt) + assistant 마지막 + edit stats)
 * @invariant tool_use 1개 ≤ beat 1개 (skip 가능)
 * @invariant beats[last].kind === 'commit' (항상 마무리)
 */
export function toBeats({ sessionId, agent, title, repo, messages }: ToBeatsArgs): BeatSession {
  const beats: Beat[] = []
  const stats: EditStats = { edits: 0, additions: 0, deletions: 0 }

  for (const msg of messages) {
    if (msg.role === 'assistant') {
      beats.push(...extractAssistantBeats(msg.blocks))
      continue
    }
    if (msg.role === 'system') {
      beats.push(...extractToolBeats(msg.blocks, stats))
    }
  }

  beats.push(synthesizeCommitBeat(messages, stats))
  return { id: sessionId, agent, title, repo, beats }
}

// ── Helpers ──────────────────────────────────────────────

/** assistant text/streaming_text 블록 → ThinkingBeat 시퀀스 */
function extractAssistantBeats(blocks: ChatBlock[]): ThinkingBeat[] {
  const beats: ThinkingBeat[] = []
  for (const b of blocks) {
    const text = readTextContent(b)
    if (text) beats.push({ kind: 'thinking', text, duration: 6000 })
  }
  return beats
}

/** system 메시지의 tool_use 블록 → Terminal/Diff Beat (skip 가능). stats 누적. */
function extractToolBeats(blocks: ChatBlock[], stats: EditStats): Beat[] {
  const beats: Beat[] = []
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block.type !== 'tool_use' || !('data' in block)) continue
    const data = block.data as { name: string; input: Record<string, unknown> }
    const result = readToolResult(blocks[i + 1])

    const beat = toToolBeat(data, result, stats)
    if (beat) beats.push(beat)
    // Read/Grep/Glob: skip (포스터로 약함, ⑩ 결정)
  }
  return beats
}

/** Bash → Terminal, Edit/Write → Diff. 그 외 null. stats는 Edit/Write에서 누적. */
function toToolBeat(
  data: { name: string; input: Record<string, unknown> },
  result: string,
  stats: EditStats,
): TerminalBeat | DiffBeat | null {
  if (data.name === 'Bash') return toTerminalBeat(data.input, result)
  if (data.name === 'Edit' || data.name === 'Write') return toDiffBeat(data.name, data.input, stats)
  return null
}

function toTerminalBeat(input: Record<string, unknown>, result: string): TerminalBeat {
  return {
    kind: 'terminal',
    duration: 5500,
    command: (input.command as string) ?? '',
    lines: parseTerminalOutput(result),
  }
}

function toDiffBeat(
  name: 'Edit' | 'Write',
  input: Record<string, unknown>,
  stats: EditStats,
): DiffBeat {
  const file = (input.file_path as string) ?? ''
  const oldStr = name === 'Edit' ? ((input.old_string as string) ?? '') : ''
  const newStr = name === 'Edit'
    ? ((input.new_string as string) ?? '')
    : ((input.content as string) ?? '')
  stats.edits += 1
  stats.additions += newStr ? newStr.split('\n').length : 0
  stats.deletions += oldStr ? oldStr.split('\n').length : 0
  return { kind: 'diff', duration: 5000, file, lines: toDiffLines(oldStr, newStr) }
}

/** 첫 user prompt + 마지막 assistant text + 누적 stats → CommitBeat 합성 */
function synthesizeCommitBeat(messages: ChatMessage[], stats: EditStats): CommitBeat {
  const userPrompt = readTextContent(
    messages.find(m => m.role === 'user')?.blocks.find(isTextBlock),
  )
  const lastAssistant = [...messages].reverse().find(m => m.role === 'assistant')
  const assistantText = readTextContent(lastAssistant?.blocks.find(isTextBlock))

  const parsed = parseCommitMessage(userPrompt)
  const message = parsed.type
    ? `${parsed.type}: ${parsed.subject}`
    : (parsed.subject || assistantText.split('\n')[0] || 'session')

  return {
    kind: 'commit',
    duration: 6000,
    message,
    body: parsed.body || assistantText,
    hash: 'draft',
    branch: 'session',
    files: stats.edits,
    additions: stats.additions,
    deletions: stats.deletions,
  }
}

/** 다음 블록이 tool_result면 본문 텍스트 추출 (없으면 빈 문자열) */
function readToolResult(next: ChatBlock | undefined): string {
  if (next && next.type === 'tool_result' && 'data' in next) return String(next.data)
  return ''
}

function isTextBlock(block: ChatBlock | undefined): boolean {
  return !!block && (block.type === 'text' || block.type === 'streaming_text') && 'content' in block
}

function readTextContent(block: ChatBlock | undefined): string {
  if (!block || !('content' in block)) return ''
  const value = (block as { content: unknown }).content
  return typeof value === 'string' ? value.trim() : ''
}

/**
 * tool_result 텍스트를 단순 라인 단위로 분해. 1차 단순화: 모든 라인을 'out'으로 분류.
 * @invariant 빈 문자열 입력 시 빈 배열
 */
export function parseTerminalOutput(text: string): Array<{ t: 'cmd' | 'out' | 'ok' | 'err'; v: string }> {
  if (!text) return []
  return text.split('\n').map(v => ({ t: 'out' as const, v }))
}

/**
 * Edit/Write의 old/new 문자열을 diff 라인 배열로 변환. 1차 단순화: ctx 없음, old=del + new=add.
 * @invariant 빈 oldStr는 del 라인 0개. 빈 newStr는 add 라인 0개.
 */
export function toDiffLines(oldStr: string, newStr: string): Array<{ t: 'add' | 'del' | 'ctx'; v: string }> {
  const out: Array<{ t: 'add' | 'del' | 'ctx'; v: string }> = []
  if (oldStr) {
    for (const v of oldStr.split('\n')) out.push({ t: 'del', v })
  }
  if (newStr) {
    for (const v of newStr.split('\n')) out.push({ t: 'add', v })
  }
  return out
}

// ② replayV2BeatPrd
import type { ChatMessage, ChatBlock } from '@os/ui/chat/types'
import type { TimelineEvent } from '../viewer/groupEvents'
import type { Beat, BeatSession, CommitBeat, DiffBeat, ReadBeat, TerminalBeat } from './beatTypes'
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
 * 변환 규칙 (TikTok 자막 패턴):
 * - tool_use 만 stage(beat)가 됨: Read/Write/Edit/Bash. 그 외 (Grep/Glob/Task ...) skip
 * - assistant text block은 beat이 아니라 **subtitle**로 다음 tool beat에 attach
 * - subtitle은 sticky: assistant text가 갱신될 때까지 이전 값 유지
 * - 마지막에 CommitBeat 1개 합성
 * @invariant tool_use 1개 = beat 1개 (Read/Write/Edit/Bash만)
 * @invariant beats[last].kind === 'commit'
 */
export function toBeats({ sessionId, agent, title, repo, messages }: ToBeatsArgs): BeatSession {
  const beats: Beat[] = []
  const stats: EditStats = { edits: 0, additions: 0, deletions: 0 }
  let subtitle: string | undefined

  for (const msg of messages) {
    if (msg.role === 'assistant') {
      const t = lastTextOf(msg.blocks)
      if (t) subtitle = t
      // timeline 변환 결과: tool_group block도 assistant role로 옴
      for (const b of msg.blocks) {
        if (b.type === 'tool_group' && 'data' in b) {
          const group = b.data as { events: TimelineEvent[] }
          beats.push(...extractToolBeatsFromEvents(group.events, stats, subtitle))
        }
      }
      continue
    }
    if (msg.role === 'system') {
      beats.push(...extractToolBeats(msg.blocks, stats, subtitle))
    }
  }

  beats.push({ ...synthesizeCommitBeat(messages, stats), subtitle })
  return { id: sessionId, agent, title, repo, beats }
}

// ── Helpers ──────────────────────────────────────────────

/** 한 메시지의 텍스트 블록 중 마지막 비어있지 않은 content. */
function lastTextOf(blocks: ChatBlock[]): string | undefined {
  for (let i = blocks.length - 1; i >= 0; i--) {
    const t = readTextContent(blocks[i])
    if (t) return t
  }
  return undefined
}

/** system 메시지의 tool_use 블록 → Read/Terminal/Diff Beat (skip 가능). stats 누적. */
function extractToolBeats(blocks: ChatBlock[], stats: EditStats, subtitle: string | undefined): Beat[] {
  const beats: Beat[] = []
  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i]
    if (block.type !== 'tool_use' || !('data' in block)) continue
    const data = block.data as { name: string; input: Record<string, unknown> }
    const result = readToolResult(blocks[i + 1])

    const beat = toToolBeat(data, result, stats)
    if (beat) beats.push({ ...beat, subtitle })
  }
  return beats
}

/** TimelineEvent[] (sidechain/live timeline) → Beat[] using event.input/result. */
function extractToolBeatsFromEvents(events: TimelineEvent[], stats: EditStats, subtitle: string | undefined): Beat[] {
  const beats: Beat[] = []
  // build map of tool_use → next tool_result for result text
  for (let i = 0; i < events.length; i++) {
    const evt = events[i]
    if (evt.type !== 'tool_use' || !evt.tool) continue
    const next = events[i + 1]
    const result = next?.type === 'tool_result' ? (next.result ?? '') : ''
    const data = { name: evt.tool, input: evt.input ?? { file_path: evt.filePath } }
    const beat = toToolBeat(data, result, stats)
    if (beat) beats.push({ ...beat, subtitle })
  }
  return beats
}

/** Bash → Terminal, Edit/Write → Diff, Read → Read. 그 외 null. */
function toToolBeat(
  data: { name: string; input: Record<string, unknown> },
  result: string,
  stats: EditStats,
): TerminalBeat | DiffBeat | ReadBeat | null {
  if (data.name === 'Bash') return toTerminalBeat(data.input, result)
  if (data.name === 'Edit' || data.name === 'Write') return toDiffBeat(data.name, data.input, stats)
  if (data.name === 'Read') return toReadBeat(data.input, result)
  return null
}

function toReadBeat(input: Record<string, unknown>, result: string): ReadBeat {
  const file = (input.file_path as string) ?? (input.path as string) ?? ''
  const lines = result ? result.split('\n').slice(0, 16) : []
  return { kind: 'read', duration: 3500, file, lines }
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
  return { kind: 'diff', duration: 8000, file, lines: toDiffLines(oldStr, newStr) }
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

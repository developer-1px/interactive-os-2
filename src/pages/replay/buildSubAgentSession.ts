// ② replayV2BeatPrd
import type { TimelineEvent } from '../finder/groupEvents'
import type { SubAgentFile, SubAgentSession } from './subAgentTypes'
import { parseJsonl } from './parseJsonl'
import { parseSubAgentMeta } from './parseSubAgentMeta'

interface RawEntry {
  isSidechain?: boolean
  sessionId?: string
  timestamp?: string
  message?: {
    role?: 'user' | 'assistant'
    content?: unknown
  }
}

/**
 * Convert raw sidechain JSONL lines → TimelineEvent[] (minimal, no grouping).
 * @invariant I4 — 모든 반환 이벤트는 isSidechain=true 엔트리에서 유래
 */
function jsonlToSidechainEvents(text: string): { events: TimelineEvent[]; sessionId: string } {
  const events: TimelineEvent[] = []
  let sessionId = ''
  for (const line of text.split('\n')) {
    const raw = parseSidechainLine(line)
    if (!raw) continue
    if (!sessionId && typeof raw.sessionId === 'string') sessionId = raw.sessionId
    appendEntryEvents(raw, events)
  }
  return { events, sessionId }
}

/** isSidechain=true인 한 줄을 파싱. 비어있거나 JSON 실패/sidechain 아님이면 null. */
function parseSidechainLine(line: string): RawEntry | null {
  if (!line) return null
  try {
    const raw = JSON.parse(line) as RawEntry
    return raw.isSidechain === true ? raw : null
  } catch {
    return null
  }
}

/** 단일 엔트리 → events 누적 (역할별 디스패치). */
function appendEntryEvents(raw: RawEntry, events: TimelineEvent[]): void {
  const ts = raw.timestamp ?? new Date().toISOString()
  const role = raw.message?.role
  const content = raw.message?.content

  if (role === 'user' && typeof content === 'string') {
    events.push({ type: 'user', ts, text: content })
    return
  }
  if (role === 'assistant' && Array.isArray(content)) {
    appendAssistantBlocks(content as Array<Record<string, unknown>>, ts, events)
    return
  }
  if (role === 'user' && Array.isArray(content)) {
    appendToolResultBlocks(content as Array<Record<string, unknown>>, ts, events)
  }
}

/** assistant content blocks (text + tool_use) → events */
function appendAssistantBlocks(
  blocks: Array<Record<string, unknown>>,
  ts: string,
  events: TimelineEvent[],
): void {
  for (const block of blocks) {
    const t = block.type
    if (t === 'text' && typeof block.text === 'string') {
      events.push({ type: 'assistant', ts, text: block.text })
    } else if (t === 'tool_use' && typeof block.name === 'string') {
      events.push(toToolUseEvent(block, ts))
    }
  }
}

/** user content blocks (tool_result만 추출) → events */
function appendToolResultBlocks(
  blocks: Array<Record<string, unknown>>,
  ts: string,
  events: TimelineEvent[],
): void {
  for (const block of blocks) {
    if (block.type !== 'tool_result') continue
    events.push({
      type: 'tool_result', ts,
      result: typeof block.content === 'string' ? block.content : undefined,
    })
  }
}

function toToolUseEvent(block: Record<string, unknown>, ts: string): TimelineEvent {
  const input = (block.input as Record<string, unknown>) ?? {}
  const filePath = (input.file_path as string) ?? (input.path as string) ?? undefined
  return {
    type: 'tool_use', ts, tool: block.name as string, filePath,
    input: (block.input as Record<string, unknown>) ?? undefined,
  }
}

/**
 * jsonl+meta+parent context → 완성된 SubAgentSession.
 * @invariant I1 — 생성된 session.sessionId === parentSessionId (불일치 시 throw)
 * @invariant I3 — startedAt ≥ 가장 가까운 이전 부모 Task tool_use.ts. 위반 시 console.warn (throw 아님, 매칭 fallback 우선)
 * @invariant I4 — events 모두 isSidechain=true (parseJsonl sidechainOnly로 강제)
 * @invariant 매칭 로직은 여기 포함 금지 (B4) — matchSubAgents.ts SSOT
 * @throws Error — I1 불변식 위반 시
 */
export function buildSubAgentSession(input: {
  file: SubAgentFile
  jsonlText: string
  metaText: string
  parentEvents?: TimelineEvent[]
  parentActive?: boolean
}): SubAgentSession {
  const { file, jsonlText, metaText, parentEvents, parentActive = false } = input

  const meta = parseSubAgentMeta(metaText, file.jsonlPath)
  const parsed = parseJsonl(jsonlText, { sidechainOnly: true })
  const { events, sessionId: innerSessionId } = jsonlToSidechainEvents(jsonlText)

  assertSessionIdMatches(innerSessionId, file.parentSessionId)
  const { startedAt, lastTs } = computeSessionBounds(events, meta.createdAt ?? 0)
  warnOnTaskOrderViolation(parentEvents, startedAt)

  // I5: parent inactive면 endedAt = lastTs 강제, active면 null
  const endedAt = parentActive ? null : lastTs
  const isActive = parentActive && endedAt === null

  return {
    sessionId: file.parentSessionId,
    agentHash: file.agentHash,
    parentSessionId: file.parentSessionId,
    agentType: meta.agentType,
    description: meta.description,
    prompt: meta.prompt,
    events,
    parsed,
    startedAt,
    endedAt,
    lastTs,
    isActive,
  }
}

// ── Helpers ──────────────────────────────────────────────

/** I1: sessionId 일치 검증. 불일치 시 throw. */
function assertSessionIdMatches(innerSessionId: string, parentSessionId: string): void {
  if (innerSessionId && innerSessionId !== parentSessionId) {
    throw new Error(
      `buildSubAgentSession: I1 sessionId mismatch — parent=${parentSessionId} jsonl=${innerSessionId}`,
    )
  }
}

/** events의 타임스탬프 범위 → startedAt/lastTs (이벤트 0건이면 fallback) */
function computeSessionBounds(
  events: TimelineEvent[],
  fallbackStartedAt: number,
): { startedAt: number; lastTs: number } {
  const tsNums = events.map((e) => new Date(e.ts).getTime()).filter((n) => Number.isFinite(n))
  const startedAt = tsNums[0] ?? fallbackStartedAt
  const lastTs = tsNums[tsNums.length - 1] ?? startedAt
  return { startedAt, lastTs }
}

/** I3: 가장 가까운 이전 부모 Task ts > sub startedAt이면 console.warn (throw 아님). */
function warnOnTaskOrderViolation(
  parentEvents: TimelineEvent[] | undefined,
  startedAt: number,
): void {
  if (!parentEvents || parentEvents.length === 0) return
  const taskTs = parentEvents
    .filter((e) => e.type === 'tool_use' && e.tool === 'Task')
    .map((e) => new Date(e.ts).getTime())
    .filter((n) => Number.isFinite(n) && n <= startedAt)
    .sort((a, b) => b - a)[0]
  if (taskTs !== undefined && taskTs > startedAt) {
    console.warn(
      `buildSubAgentSession: I3 violation — parent Task ts ${taskTs} > sub startedAt ${startedAt}`,
    )
  }
}

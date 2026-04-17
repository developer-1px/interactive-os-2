import type { TimelineEvent } from '../viewer/groupEvents'
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
    if (!line) continue
    let raw: RawEntry
    try {
      raw = JSON.parse(line)
    } catch {
      continue
    }
    if (raw.isSidechain !== true) continue
    if (!sessionId && typeof raw.sessionId === 'string') sessionId = raw.sessionId
    const ts = raw.timestamp ?? new Date().toISOString()
    const role = raw.message?.role
    const content = raw.message?.content

    if (role === 'user' && typeof content === 'string') {
      events.push({ type: 'user', ts, text: content })
      continue
    }
    if (role === 'assistant' && Array.isArray(content)) {
      for (const block of content as Array<Record<string, unknown>>) {
        const t = block.type
        if (t === 'text' && typeof block.text === 'string') {
          events.push({ type: 'assistant', ts, text: block.text })
        } else if (t === 'tool_use' && typeof block.name === 'string') {
          const input = (block.input as Record<string, unknown>) ?? {}
          const filePath = (input.file_path as string) ?? (input.path as string) ?? undefined
          events.push({ type: 'tool_use', ts, tool: block.name, filePath })
        }
      }
      continue
    }
    if (role === 'user' && Array.isArray(content)) {
      for (const block of content as Array<Record<string, unknown>>) {
        if (block.type === 'tool_result') {
          events.push({ type: 'tool_result', ts })
        }
      }
    }
  }
  return { events, sessionId }
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
  // parsed cache (sidechain only)
  const parsed = parseJsonl(jsonlText, { sidechainOnly: true })
  const { events, sessionId: innerSessionId } = jsonlToSidechainEvents(jsonlText)

  // I1: sessionId 일치 검증
  if (innerSessionId && innerSessionId !== file.parentSessionId) {
    throw new Error(
      `buildSubAgentSession: I1 sessionId mismatch — parent=${file.parentSessionId} jsonl=${innerSessionId}`,
    )
  }

  const tsNums = events.map((e) => new Date(e.ts).getTime()).filter((n) => Number.isFinite(n))
  const startedAt = tsNums[0] ?? meta.createdAt ?? 0
  const lastTs = tsNums[tsNums.length - 1] ?? startedAt
  // I5: parent inactive면 endedAt = lastTs 강제, active면 null
  const endedAt = parentActive ? null : lastTs
  const isActive = parentActive && endedAt === null

  // I3 검증: 가장 가까운 이전 부모 Task ts와 비교
  if (parentEvents && parentEvents.length > 0) {
    const taskTs = parentEvents
      .filter((e) => e.type === 'tool_use' && e.tool === 'Task')
      .map((e) => new Date(e.ts).getTime())
      .filter((n) => Number.isFinite(n) && n <= startedAt)
      .sort((a, b) => b - a)[0]
    if (taskTs !== undefined && taskTs > startedAt) {
      // eslint-disable-next-line no-console
      console.warn(
        `buildSubAgentSession: I3 violation — parent Task ts ${taskTs} > sub startedAt ${startedAt}`,
      )
    }
  }

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

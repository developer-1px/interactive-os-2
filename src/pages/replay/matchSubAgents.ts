import type { TimelineEvent } from '../finder/groupEvents'
import type { SubAgentMatchKey, SubAgentSession } from './subAgentTypes'

/** 매칭 결과 1건. orphan=true면 parentToolUseId 미결정. */
export interface SubAgentMatch {
  agentHash: string
  key: SubAgentMatchKey
  parentToolUseId: string | null
  orphan: boolean
}

interface TaskUse {
  id: string
  uuid: string | undefined
  description: string
  ts: number
}

/**
 * 부모 타임라인의 Task tool_use ↔ SubAgentSession[] 매칭.
 * @invariant I6 — 우선순위: description 정확일치 → toolUseTs ≤ startedAt 근접(≤ windowMs) → parentUuid 연결 → orphan
 * @invariant 동일 description이 여러 개일 때 시각순 fallback 필수 (임의 선택 금지)
 * @invariant 이 파일이 매칭 SSOT. buildSubAgentSession/PageReplay에서 비교 로직 중복 금지 (B4)
 */
export function matchSubAgents(args: {
  parentEvents: TimelineEvent[]
  subagents: SubAgentSession[]
  windowMs?: number
}): SubAgentMatch[] {
  const { parentEvents, subagents, windowMs = 5000 } = args

  // 1. Task(Agent) tool_use 추출. TimelineEvent에는 id/uuid/input이 없으므로 index 기반 id 생성.
  const taskUses: TaskUse[] = parentEvents
    .filter((e) => e.type === 'tool_use' && e.tool === 'Task')
    .map((e, i): TaskUse => ({
      id: `task-${i}-${e.ts}`,
      uuid: (e as TimelineEvent & { uuid?: string }).uuid,
      // description은 tool_use 이벤트의 text에 투영된다고 가정 (fallback 빈 문자열)
      description: (e as TimelineEvent & { description?: string }).description ?? e.text ?? '',
      ts: new Date(e.ts).getTime(),
    }))
    .sort((a, b) => a.ts - b.ts)

  const consumed = new Set<string>()

  return subagents.map((sub): SubAgentMatch => {
    // 1차: description 정확일치 (미소비, 시각순 첫)
    let hit: TaskUse | undefined
    if (sub.description) {
      hit = taskUses.find((t) => !consumed.has(t.id) && t.description === sub.description)
    }

    // 2차: toolUseTs ≤ startedAt 근접
    if (!hit) {
      hit = taskUses
        .filter(
          (t) =>
            !consumed.has(t.id) &&
            t.ts <= sub.startedAt &&
            sub.startedAt - t.ts <= windowMs,
        )
        .sort((a, b) => b.ts - a.ts)[0]
    }

    // 3차: parentUuid 체인 탐색
    if (!hit) {
      const rootParentUuid = (sub.events[0] as (TimelineEvent & { parentUuid?: string }) | undefined)
        ?.parentUuid
      if (rootParentUuid) {
        hit = taskUses.find((t) => !consumed.has(t.id) && t.uuid === rootParentUuid)
      }
    }

    if (!hit) {
      return {
        agentHash: sub.agentHash,
        key: { description: sub.description, toolUseTs: sub.startedAt },
        parentToolUseId: null,
        orphan: true,
      }
    }

    consumed.add(hit.id)
    return {
      agentHash: sub.agentHash,
      key: { description: sub.description, toolUseTs: hit.ts, toolUseId: hit.id },
      parentToolUseId: hit.id,
      orphan: false,
    }
  })
}

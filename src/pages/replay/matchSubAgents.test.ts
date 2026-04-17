import { describe, it, expect } from 'vitest'
import type { TimelineEvent } from '../viewer/groupEvents'
import type { SubAgentSession } from './subAgentTypes'
import { matchSubAgents } from './matchSubAgents'

function mkTaskEvent(
  ts: string,
  description: string,
  uuid?: string,
): TimelineEvent {
  return {
    type: 'tool_use',
    tool: 'Task',
    ts,
    text: description,
    description,
    uuid,
  } as TimelineEvent
}

function mkSub(
  agentHash: string,
  description: string,
  startedAt: number,
  opts?: { rootParentUuid?: string },
): SubAgentSession {
  const rootEvent: TimelineEvent = opts?.rootParentUuid
    ? ({
        type: 'user',
        ts: new Date(startedAt).toISOString(),
        parentUuid: opts.rootParentUuid,
      } as TimelineEvent)
    : ({ type: 'user', ts: new Date(startedAt).toISOString() } as TimelineEvent)
  return {
    sessionId: 'parent-1',
    agentHash,
    parentSessionId: 'parent-1',
    agentType: 'explore',
    description,
    events: [rootEvent],
    startedAt,
    endedAt: null,
    lastTs: startedAt,
    isActive: true,
  }
}

describe('matchSubAgents', () => {
  it('V1: description 정확일치 1:1 성공 (orphan=false)', () => {
    const t0 = Date.parse('2026-04-17T00:00:00Z')
    const parentEvents: TimelineEvent[] = [mkTaskEvent(new Date(t0).toISOString(), 'Explore')]
    const subs = [mkSub('h1', 'Explore', t0 + 100)]

    const result = matchSubAgents({ parentEvents, subagents: subs })

    expect(result).toHaveLength(1)
    expect(result[0].orphan).toBe(false)
    expect(result[0].parentToolUseId).not.toBeNull()
    expect(result[0].key.description).toBe('Explore')
  })

  it('V3: 동일 description 2개 → consumed Set + 시각순 fallback 으로 둘 다 매칭', () => {
    const t0 = Date.parse('2026-04-17T00:00:00Z')
    const parentEvents: TimelineEvent[] = [
      mkTaskEvent(new Date(t0).toISOString(), 'Explore'),
      mkTaskEvent(new Date(t0 + 150).toISOString(), 'Explore'),
    ]
    const subs = [
      mkSub('h1', 'Explore', t0 + 50),
      mkSub('h2', 'Explore', t0 + 250),
    ]

    const result = matchSubAgents({ parentEvents, subagents: subs })

    expect(result).toHaveLength(2)
    expect(result[0].orphan).toBe(false)
    expect(result[1].orphan).toBe(false)
    // 서로 다른 Task에 매칭되어야 함
    expect(result[0].parentToolUseId).not.toBe(result[1].parentToolUseId)
  })

  it('V4: description 매칭 실패 + parentUuid 체인도 miss → orphan=true', () => {
    const t0 = Date.parse('2026-04-17T00:00:00Z')
    const parentEvents: TimelineEvent[] = [
      mkTaskEvent(new Date(t0).toISOString(), 'bar', 'uuid-bar'),
    ]
    // window 밖(10초 뒤) + parentUuid도 불일치
    const subs = [mkSub('h1', 'foo', t0 + 60_000, { rootParentUuid: 'uuid-missing' })]

    const result = matchSubAgents({ parentEvents, subagents: subs })

    expect(result).toHaveLength(1)
    expect(result[0].orphan).toBe(true)
    expect(result[0].parentToolUseId).toBeNull()
  })

  it('parentUuid 체인 매칭 (description miss, 근접 window 밖)', () => {
    const t0 = Date.parse('2026-04-17T00:00:00Z')
    const parentEvents: TimelineEvent[] = [
      mkTaskEvent(new Date(t0).toISOString(), 'bar', 'uuid-bar'),
    ]
    // window(5s) 밖 + description miss + parentUuid 일치
    const subs = [mkSub('h1', 'foo', t0 + 60_000, { rootParentUuid: 'uuid-bar' })]

    const result = matchSubAgents({ parentEvents, subagents: subs })

    expect(result[0].orphan).toBe(false)
    expect(result[0].parentToolUseId).not.toBeNull()
  })
})

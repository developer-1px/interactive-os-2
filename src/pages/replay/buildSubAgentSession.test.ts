import { describe, it, expect } from 'vitest'
import type { SubAgentFile } from './subAgentTypes'
import { buildSubAgentSession } from './buildSubAgentSession'

function mkFile(overrides?: Partial<SubAgentFile>): SubAgentFile {
  return {
    parentSessionId: 'parent-1',
    agentHash: 'h1',
    jsonlPath: 'agent-h1.jsonl',
    metaPath: 'agent-h1.meta.json',
    mtime: 0,
    ...overrides,
  }
}

const metaText = JSON.stringify({
  agentHash: 'h1',
  agentType: 'explore',
  description: 'Do it',
  createdAt: 0,
})

function sideLine(ts: string, text: string): string {
  return JSON.stringify({
    sessionId: 'parent-1',
    isSidechain: true,
    timestamp: ts,
    message: { role: 'user', content: text },
  })
}

describe('buildSubAgentSession', () => {
  it('I1: session.sessionId === parent.sessionId', () => {
    const jsonl = [
      sideLine('2026-04-17T00:00:00Z', 'hello'),
      sideLine('2026-04-17T00:00:05Z', 'world'),
    ].join('\n')

    const session = buildSubAgentSession({
      file: mkFile(),
      jsonlText: jsonl,
      metaText,
    })

    expect(session.sessionId).toBe('parent-1')
    expect(session.parentSessionId).toBe('parent-1')
  })

  it('I1: sessionId 불일치 시 throw', () => {
    const badJsonl = JSON.stringify({
      sessionId: 'OTHER',
      isSidechain: true,
      timestamp: '2026-04-17T00:00:00Z',
      message: { role: 'user', content: 'x' },
    })
    expect(() =>
      buildSubAgentSession({
        file: mkFile(),
        jsonlText: badJsonl,
        metaText,
      }),
    ).toThrow(/I1/)
  })

  it('I5: parentActive=false → isActive=false, endedAt=lastTs', () => {
    const t0 = '2026-04-17T00:00:00Z'
    const t1 = '2026-04-17T00:00:10Z'
    const jsonl = [sideLine(t0, 'a'), sideLine(t1, 'b')].join('\n')

    const session = buildSubAgentSession({
      file: mkFile(),
      jsonlText: jsonl,
      metaText,
      parentActive: false,
    })

    expect(session.isActive).toBe(false)
    expect(session.endedAt).toBe(session.lastTs)
    expect(session.endedAt).toBe(Date.parse(t1))
  })

  it('I5: parentActive=true → isActive=true, endedAt=null', () => {
    const jsonl = sideLine('2026-04-17T00:00:00Z', 'a')
    const session = buildSubAgentSession({
      file: mkFile(),
      jsonlText: jsonl,
      metaText,
      parentActive: true,
    })
    expect(session.isActive).toBe(true)
    expect(session.endedAt).toBeNull()
  })

  it('events 는 sidechain 엔트리에서 유래 (I4)', () => {
    const mainLine = JSON.stringify({
      sessionId: 'parent-1',
      isSidechain: false,
      timestamp: '2026-04-17T00:00:00Z',
      message: { role: 'user', content: 'MAIN' },
    })
    const sLine = sideLine('2026-04-17T00:00:01Z', 'SIDE')
    const jsonl = [mainLine, sLine].join('\n')

    const session = buildSubAgentSession({
      file: mkFile(),
      jsonlText: jsonl,
      metaText,
    })

    // sidechain entry 1개만 events 로 들어와야 함
    expect(session.events).toHaveLength(1)
    expect(session.events[0].text).toBe('SIDE')
  })
})

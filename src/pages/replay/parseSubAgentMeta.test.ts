import { describe, it, expect } from 'vitest'
import {
  extractAgentHashFromFilename,
  extractAgentHash,
  parseSubAgentMeta,
} from './parseSubAgentMeta'

describe('extractAgentHashFromFilename', () => {
  it('agent-{hash}.jsonl 에서 hash 추출', () => {
    expect(extractAgentHashFromFilename('agent-abc123.jsonl')).toBe('abc123')
  })

  it('agent-{hash}.meta.json 에서 hash 추출', () => {
    expect(extractAgentHashFromFilename('agent-abc123.meta.json')).toBe('abc123')
  })

  it('경로 포함 filename 에서도 hash 추출', () => {
    expect(extractAgentHashFromFilename('/foo/bar/subagents/agent-xyz.jsonl')).toBe('xyz')
  })

  it('alias extractAgentHash 동일 동작', () => {
    expect(extractAgentHash('agent-deadbeef.meta.json')).toBe('deadbeef')
  })

  it('규약 불일치 시 throw', () => {
    expect(() => extractAgentHashFromFilename('not-an-agent.txt')).toThrow()
  })
})

describe('parseSubAgentMeta', () => {
  it('정상 meta 파싱', () => {
    const text = JSON.stringify({
      agentHash: 'abc123',
      agentType: 'explore',
      description: 'Do the thing',
      prompt: 'go',
      createdAt: 1_700_000_000_000,
    })
    const meta = parseSubAgentMeta(text, 'agent-abc123.meta.json')
    expect(meta.agentHash).toBe('abc123')
    expect(meta.agentType).toBe('explore')
    expect(meta.description).toBe('Do the thing')
    expect(meta.prompt).toBe('go')
    expect(meta.createdAt).toBe(1_700_000_000_000)
  })

  it('meta 내 agentHash 누락 시 filename 에서 보강', () => {
    const text = JSON.stringify({
      agentType: 'explore',
      description: 'x',
      createdAt: 0,
    })
    const meta = parseSubAgentMeta(text, 'agent-fromfile.meta.json')
    expect(meta.agentHash).toBe('fromfile')
  })

  it('I2: filename hash ↔ meta agentHash 불일치 시 throw', () => {
    const text = JSON.stringify({
      agentHash: 'meta-hash',
      agentType: 'explore',
      description: 'x',
      createdAt: 0,
    })
    expect(() => parseSubAgentMeta(text, 'agent-file-hash.meta.json')).toThrow(/I2/)
  })

  it('JSON.parse 실패 시 throw', () => {
    expect(() => parseSubAgentMeta('not json', 'agent-x.meta.json')).toThrow()
  })
})

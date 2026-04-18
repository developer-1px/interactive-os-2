var e=`import { describe, it, expect } from 'vitest'
import { parseJsonl } from './parseJsonl'

const mainEntry = JSON.stringify({
  message: { role: 'user', content: 'hello main' },
  timestamp: '2026-04-17T00:00:00Z',
  isSidechain: false,
  sessionId: 'parent-1',
})

const sideEntry = JSON.stringify({
  message: { role: 'user', content: 'hello sidechain' },
  timestamp: '2026-04-17T00:00:01Z',
  isSidechain: true,
  sessionId: 'parent-1',
})

describe('parseJsonl — sidechain filter (I4)', () => {
  it('V13: sidechainOnly=true → isSidechain=true 엔트리만', () => {
    const text = [mainEntry, sideEntry].join('\\n')
    const { messages } = parseJsonl(text, { sidechainOnly: true })

    expect(messages).toHaveLength(1)
    expect(messages[0].role).toBe('user')
    const block = messages[0].blocks[0]
    expect(block.type).toBe('text')
    if (block.type === 'text') expect((block as { content: string }).content).toBe('hello sidechain')
  })

  it('V13: 기본(sidechainOnly 미지정) → isSidechain=true 엔트리는 스킵 (기존 동작)', () => {
    const text = [mainEntry, sideEntry].join('\\n')
    const { messages } = parseJsonl(text)

    expect(messages).toHaveLength(1)
    const block = messages[0].blocks[0]
    if (block.type === 'text') expect((block as { content: string }).content).toBe('hello main')
  })

  it('sidechainOnly=false 는 기본과 동일 (메인만)', () => {
    const text = [mainEntry, sideEntry].join('\\n')
    const { messages } = parseJsonl(text, { sidechainOnly: false })

    expect(messages).toHaveLength(1)
    const block = messages[0].blocks[0]
    if (block.type === 'text') expect((block as { content: string }).content).toBe('hello main')
  })
})
`;export{e as default};
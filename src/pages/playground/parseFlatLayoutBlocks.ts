// assistant 메시지의 ```flatlayout 블록을 ToolCall 배열로 파싱.
// 블록 안은 JSON — 단일 ToolCall 객체 또는 배열 둘 다 허용.
// 포맷은 Anthropic tool_use 와 동형: { tool, input }.
import type { ToolCall } from './layoutTools'

const BLOCK_RX = /```flatlayout\s*\n([\s\S]*?)```/g

export function parseFlatLayoutBlocks(text: string): ToolCall[] {
  const calls: ToolCall[] = []
  let m: RegExpExecArray | null
  while ((m = BLOCK_RX.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(m[1])
      if (Array.isArray(parsed)) {
        for (const c of parsed) {
          if (c && typeof c.tool === 'string') calls.push(c)
        }
      } else if (parsed && typeof parsed.tool === 'string') {
        calls.push(parsed)
      }
    } catch {
      // invalid JSON — ignore block
    }
  }
  return calls
}

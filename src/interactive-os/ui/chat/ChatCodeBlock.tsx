// ② 2026-03-27-chat-module-prd.md
import { CodeBlock as BaseCodeBlock } from '../CodeBlock'
import type { CodeBlock as CodeBlockType } from './types'

export function ChatCodeBlock({ block }: { block: CodeBlockType }) {
  const filename = block.filename ?? `snippet.${block.language ?? 'txt'}`
  return <BaseCodeBlock code={block.content} filename={filename} />
}

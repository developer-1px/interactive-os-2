// ② 2026-03-27-chat-module-prd.md
// ② code-viewer-prd.md
import { CodeViewer } from '../CodeViewer'
import type { CodeBlock as CodeBlockType } from './types'

export function ChatCodeBlock({ block }: { block: CodeBlockType }) {
  const filename = block.filename ?? `snippet.${block.language ?? 'txt'}`
  return <CodeViewer code={block.content} filename={filename} preset="chat" />
}

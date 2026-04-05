// ② 2026-03-31-chat-perf-prd.md
import { memo } from 'react'
import { MarkdownViewer } from '../MarkdownViewer'
import type { TextBlock as TextBlockType } from './types'

export const TextBlock = memo(function TextBlock({ block }: { block: TextBlockType }) {
  return <MarkdownViewer content={block.content} prose={false} codeVariant="compact" />
})

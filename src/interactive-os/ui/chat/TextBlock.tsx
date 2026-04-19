// ② 2026-03-31-chat-perf-prd.md
import { memo } from 'react'
import { MarkdownPreview } from '../MarkdownPreview'
import type { TextBlock as TextBlockType } from './types'

export const TextBlock = memo(function TextBlock({ block }: { block: TextBlockType }) {
  return <MarkdownPreview content={block.content} prose={false} codePreset="chat" />
})

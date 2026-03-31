// ② 2026-03-31-chat-perf-prd.md
import { memo } from 'react'
import { MarkdownViewer } from '../MarkdownViewer'
import chatStyles from './TextBlock.module.css'
import type { TextBlock as TextBlockType } from './types'

export const TextBlock = memo(function TextBlock({ block }: { block: TextBlockType }) {
  return <MarkdownViewer content={block.content} styles={chatStyles} codeVariant="compact" />
})

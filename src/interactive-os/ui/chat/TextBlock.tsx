// ② 2026-03-27-chat-module-prd.md
import { MarkdownViewer } from '../MarkdownViewer'
import chatStyles from './TextBlock.module.css'
import type { TextBlock as TextBlockType } from './types'

export function TextBlock({ block }: { block: TextBlockType }) {
  return <MarkdownViewer content={block.content} styles={chatStyles} />
}

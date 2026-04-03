import { CodeBlock, type HighlightTone } from './CodeBlock'
import { MarkdownViewer } from './MarkdownViewer'
import { ax } from '@styles/ax'

interface FilePreviewProps {
  content: string
  filename: string
  highlightLines?: Map<number, HighlightTone>
  variant?: 'flush' | 'compact'
}

export function FilePreview({ content, filename, highlightLines, variant = 'flush' }: FilePreviewProps) {
  const isMarkdown = filename.endsWith('.md')

  if (isMarkdown) {
    return (
      <div className={ax({ padding: 'lg' })}>
        <MarkdownViewer content={content} />
      </div>
    )
  }

  return (
    <CodeBlock
      code={content}
      filename={filename}
      highlightLines={highlightLines}
      variant={variant}
    />
  )
}

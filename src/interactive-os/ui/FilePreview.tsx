import { useMemo } from 'react'
import { CodeBlock, type HighlightTone } from './CodeBlock'
import { VirtualCodeBlock } from './VirtualCodeBlock'
import { MarkdownViewer } from './MarkdownViewer'
import { ax } from '@styles/ax'

const VIRTUAL_THRESHOLD = 500

interface FilePreviewProps {
  content: string
  filename: string
  highlightLines?: Map<number, HighlightTone>
  variant?: 'flush' | 'compact'
}

export function FilePreview({ content, filename, highlightLines, variant = 'flush' }: FilePreviewProps) {
  const isMarkdown = filename.endsWith('.md')
  const lineCount = useMemo(() => content.split('\n').length, [content])

  if (isMarkdown) {
    return (
      <div className={ax({ padding: 'lg' })}>
        <MarkdownViewer content={content} />
      </div>
    )
  }

  if (lineCount > VIRTUAL_THRESHOLD) {
    return (
      <VirtualCodeBlock
        code={content}
        filename={filename}
        highlightLines={highlightLines}
        variant={variant}
      />
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

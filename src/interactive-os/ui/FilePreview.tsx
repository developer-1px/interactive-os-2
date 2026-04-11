/** @catalog 파일 내용 미리보기 — registry 기반 (이미지/코드/마크다운) */
import { useMemo } from 'react'
import { CodeBlock, type HighlightTone } from './CodeBlock'
import { VirtualCodeBlock } from './VirtualCodeBlock'
import { MarkdownViewer } from './MarkdownViewer'
import { getFileRenderer, defineFileRenderer, type FileRenderProps } from './fileRenderers'
import { ax } from '@styles/ax'

const VIRTUAL_THRESHOLD = 500

// --- Built-in renderers ---

defineFileRenderer(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'], {
  source: 'url',
  render: ({ src, filename }: FileRenderProps) => (
    <div className={ax({ layout: 'center', flex: '1', padding: 'md' })}>
      <img src={src} alt={filename.split('/').pop() ?? ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
    </div>
  ),
})

defineFileRenderer(['md'], {
  source: 'text',
  render: ({ content }: FileRenderProps) => (
    <div className={ax({ padding: 'lg' })}>
      <MarkdownViewer content={content} />
    </div>
  ),
})

// code는 fallback으로 처리 — registry에 없는 확장자는 모두 code

// --- Component ---

interface FilePreviewProps {
  content: string
  filename: string
  highlightLines?: Set<number> | Map<number, HighlightTone>
  variant?: 'flush' | 'compact'
  /** 이미지 등 바이너리 파일의 URL (source: 'url' 렌더러용) */
  src?: string
}

export function FilePreview({ content, filename, highlightLines, variant = 'flush', src }: FilePreviewProps) {
  const renderer = getFileRenderer(filename)
  const lineCount = useMemo(() => content.split('\n').length, [content])

  if (renderer) {
    const resolvedSrc = src ?? `/api/fs/file?path=${encodeURIComponent(filename)}`
    return <>{renderer.render({ content, src: resolvedSrc, filename, highlightLines, variant })}</>
  }

  // Fallback: code renderer
  if (lineCount > VIRTUAL_THRESHOLD) {
    return (
      <VirtualCodeBlock
        code={content}
        filename={filename}
        highlightLines={highlightLines instanceof Map ? highlightLines : undefined}
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

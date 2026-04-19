/** @catalog 파일 내용 미리보기 — registry 기반 (이미지/코드/마크다운) */
// ② code-viewer-prd.md
import { CodePreview, type HighlightTone, type CodeViewerPreset } from './CodePreview'
import { getFileRenderer, defineFileRenderer, type FileRenderProps } from './fileRenderers'
import { ax } from '@styles/ax'

// --- Built-in renderers ---
// .md 는 pages/showcase/registerMdRenderer 에서 등록 (showcaseMdConfig 주입 필요, ui→pages 차단)

defineFileRenderer(['png', 'jpg', 'jpeg', 'gif', 'svg', 'webp', 'ico', 'bmp'], {
  source: 'url',
  render: ({ src, filename }: FileRenderProps) => (
    <div className={ax({ layout: 'center', flex: '1' })}>
      <img src={src} alt={filename.split('/').pop() ?? ''} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
    </div>
  ),
})

// code는 fallback으로 처리 — registry에 없는 확장자는 모두 code

// --- Component ---

interface FilePreviewProps {
  content: string
  filename: string
  highlightLines?: Set<number> | Map<number, HighlightTone>
  preset?: CodeViewerPreset
  /** 이미지 등 바이너리 파일의 URL (source: 'url' 렌더러용) */
  src?: string
}

export function FilePreview({ content, filename, highlightLines, preset = 'doc', src }: FilePreviewProps) {
  const renderer = getFileRenderer(filename)

  if (renderer) {
    const resolvedSrc = src ?? `/api/fs/file?path=${encodeURIComponent(filename)}`
    return <>{renderer.render({ content, src: resolvedSrc, filename, highlightLines, preset })}</>
  }

  return (
    <CodePreview
      code={content}
      filename={filename}
      highlightLines={highlightLines}
      preset={preset}
    />
  )
}

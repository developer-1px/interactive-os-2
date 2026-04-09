// @useState-hatch — content: async file fetch
import { useState, useEffect } from 'react'
import { fetchFile } from '../fsClient'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { SpinnerIndicator } from '@os/ui/indicators'
import { ax } from '@styles/ax'

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp'])

function isImageFile(path: string): boolean {
  const ext = path.slice(path.lastIndexOf('.')).toLowerCase()
  return IMAGE_EXTS.has(ext)
}

export function DocsPreview({ nodeId }: { nodeId: string }) {
  if (isImageFile(nodeId)) {
    return (
      <div className={ax({ layout: 'center', flex: '1' })}>
        <img
          src={`/api/fs/file?path=${encodeURIComponent(nodeId)}`}
          alt={nodeId.split('/').pop() ?? ''}
          className={ax({ width: 'full' })}
        />
      </div>
    )
  }

  const [content, setContent] = useState<string | null>(null)
  useEffect(() => {
    setContent(null)
    fetchFile(nodeId).then(setContent).catch(() => setContent('Failed to load file.'))
  }, [nodeId])
  if (content === null) return <SpinnerIndicator size="sm" />
  return <MarkdownViewer content={content} />
}

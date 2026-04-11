// @useState-hatch — content: async file fetch
import { useState, useEffect } from 'react'
import { fetchFile } from '../fsClient'
import { FilePreview } from '@os/ui/FilePreview'
import { getFileSource } from '@os/ui/fileRenderers'
import { SpinnerIndicator } from '@os/ui/indicators'

export function DocsPreview({ nodeId }: { nodeId: string }) {
  const source = getFileSource(nodeId)
  const filename = nodeId.split('/').pop() ?? ''

  if (source === 'url') {
    return (
      <FilePreview
        content=""
        filename={filename}
        src={`/api/fs/file?path=${encodeURIComponent(nodeId)}`}
      />
    )
  }

  const [content, setContent] = useState<string | null>(null)
  useEffect(() => {
    setContent(null)
    fetchFile(nodeId).then(setContent).catch(() => setContent('Failed to load file.'))
  }, [nodeId])
  if (content === null) return <SpinnerIndicator size="sm" />
  return <FilePreview content={content} filename={filename} />
}

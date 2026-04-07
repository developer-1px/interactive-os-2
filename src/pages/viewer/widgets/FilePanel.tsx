// @useState-hatch — content: async file fetch; spreadMode: view toggle
import { useState, useEffect, useRef, useMemo } from 'react'
import { SpreadReader } from '@os/ui/SpreadReader'
import { FilePreview } from '@os/ui/FilePreview'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { fetchFile } from '../fsClient'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'

export function FilePanel({ path }: { path: string }) {
  const [content, setContent] = useState('')
  const [spreadMode, setSpreadMode] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo(0, 0)
    fetchFile(path).then(setContent)
  }, [path])

  const filename = path.split('/').pop() ?? ''
  const isMarkdown = filename.endsWith('.md')

  const keyMap = useMemo(() => ({
    'Meta+b': defineRouteKey('file-panel:toggle-spread', () => { if (isMarkdown) setSpreadMode(s => !s) }, 'FilePanel'),
  }), [isMarkdown])

  if (isMarkdown && spreadMode) {
    return (
      <AriaRoute keyMap={keyMap}>
        <SpreadReader resetKey={path}>
          <MarkdownViewer content={content} />
        </SpreadReader>
      </AriaRoute>
    )
  }

  return (
    <AriaRoute keyMap={keyMap}>
      <div className={ax({ layout: 'fill' })}>
        <ScrollArea ref={bodyRef} className={ax({ flex: '1' })}>
          <FilePreview content={content} filename={filename} />
        </ScrollArea>
      </div>
    </AriaRoute>
  )
}

// @useState-hatch — content: async file fetch; spreadMode: view toggle
import { useState, useEffect, useRef, useMemo } from 'react'

const fileCache = new Map<string, string>()
import { SpreadReader } from '@os/ui/SpreadReader'
import { FilePreview } from '@os/ui/FilePreview'
import { MarkdownPreview } from '@os/ui/MarkdownPreview'
import { showcaseMdConfig } from '../../showcase/mdConfig'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { defineRouteKey } from '@os/primitives/defineRouteKey'
import { getFileSource } from '@os/ui/fileRenderers'
import { fetchFile } from '../fsClient'
import { ax } from '@styles/ax'
import { ScrollArea } from '@os/ui/ScrollArea'

export function FilePanel({ path }: { path: string }) {
  const source = getFileSource(path)
  const [content, setContent] = useState('')
  const [spreadMode, setSpreadMode] = useState(false)
  const bodyRef = useRef<HTMLDivElement>(null)

  const filename = path.split('/').pop() ?? ''
  const isMarkdown = filename.endsWith('.md')

  useEffect(() => {
    bodyRef.current?.scrollTo(0, 0)
    if (source !== 'text') return
    const cached = fileCache.get(path)
    if (cached !== undefined) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setContent(cached)
      return
    }
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setContent('')
    let cancelled = false
    fetchFile(path).then((text) => {
      fileCache.set(path, text)
      if (!cancelled) setContent(text)
    })
    return () => { cancelled = true }
  }, [path, source])

  const keyMap = useMemo(() => ({
    'Meta+b': defineRouteKey('file-panel:toggle-spread', () => { if (isMarkdown) setSpreadMode(s => !s) }, 'FilePanel'),
  }), [isMarkdown])

  if (isMarkdown && spreadMode) {
    return (
      <AriaRoute keyMap={keyMap}>
        <SpreadReader resetKey={path}>
          <MarkdownPreview content={content} config={showcaseMdConfig} />
        </SpreadReader>
      </AriaRoute>
    )
  }

  const src = `/api/fs/file?path=${encodeURIComponent(path)}`

  return (
    <AriaRoute keyMap={keyMap}>
      <div className={ax({ layout: 'fill' })}>
        <ScrollArea ref={bodyRef} className={ax({ flex: '1' })}>
          <FilePreview content={content} filename={filename} src={src} />
        </ScrollArea>
      </div>
    </AriaRoute>
  )
}

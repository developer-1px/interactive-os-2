import { useState, useEffect, useRef, useMemo } from 'react'
import { CodeBlock } from '@os/ui/CodeBlock'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { SpreadReader } from '@os/ui/SpreadReader'
import { AriaRoute } from '@os/primitives/AriaRoute'
import { fetchFile } from '../fsClient'
import { ax } from '@styles/ax'

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
    'Meta+b': () => { if (isMarkdown) setSpreadMode(s => !s); return { type: 'file-panel:toggle-spread' } as const },
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
      <div ref={bodyRef} className={ax({ layout: 'scroll', flex: '1' })}>
        {isMarkdown
          ? <MarkdownViewer content={content} />
          : <CodeBlock code={content} filename={filename} variant="flush" />
        }
      </div>
    </AriaRoute>
  )
}

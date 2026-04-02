import { useState, useEffect, useRef } from 'react'
import { CodeBlock } from '@os/ui/CodeBlock'
import { MarkdownViewer } from '@os/ui/MarkdownViewer'
import { fetchFile } from '../fsClient'
import { ax } from '@styles/ax'

export function FilePanel({ path }: { path: string }) {
  const [content, setContent] = useState('')
  const bodyRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bodyRef.current?.scrollTo(0, 0)
    fetchFile(path).then(setContent)
  }, [path])

  const filename = path.split('/').pop() ?? ''
  const isMarkdown = filename.endsWith('.md')

  return (
    <div ref={bodyRef} className={ax({ layout: 'scroll', flex: '1' })}>
      {isMarkdown
        ? <MarkdownViewer content={content} />
        : <CodeBlock code={content} filename={filename} variant="flush" />
      }
    </div>
  )
}

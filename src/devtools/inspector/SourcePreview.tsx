// ② 2026-04-02-inspector-source-preview-prd.md
import { useEffect, useMemo, useState } from 'react'
import { computePlacement } from '../../misc/computePlacement'
import { CodeBlock } from '@os/ui/CodeBlock'

interface SourcePreviewProps {
  filePath: string | null
  lineNumber: number
  anchor: { x: number; y: number }
}

const PREVIEW_WIDTH = 480
const PREVIEW_HEIGHT = 140
const CONTEXT_LINES = 2

// Module-scope cache survives re-mounts
const fileCache = new Map<string, string>()

export function SourcePreview({ filePath, lineNumber, anchor }: SourcePreviewProps) {
  const [snippet, setSnippet] = useState<string>('')
  const [error, setError] = useState(false)

  const contentWidth = Math.min(PREVIEW_WIDTH, window.innerWidth - 16)

  const placement = useMemo(() =>
    computePlacement({
      anchor,
      content: { width: contentWidth, height: PREVIEW_HEIGHT },
      viewport: { width: window.innerWidth, height: window.innerHeight },
    }),
  [anchor.x, anchor.y, contentWidth])

  useEffect(() => {
    if (!filePath) {
      setSnippet('')
      setError(false)
      return
    }

    const cached = fileCache.get(filePath)
    if (cached) {
      setSnippet(extractSnippet(cached, lineNumber))
      setError(false)
      return
    }

    const controller = new AbortController()

    fetch(`/__inspector_source?file=${encodeURIComponent(filePath)}`, { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error(); return res.text() })
      .then(text => {
        fileCache.set(filePath, text)
        if (!controller.signal.aborted) {
          setSnippet(extractSnippet(text, lineNumber))
          setError(false)
        }
      })
      .catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (!controller.signal.aborted) {
          setSnippet('')
          setError(true)
        }
      })

    return () => controller.abort()
  }, [filePath, lineNumber])

  const startLine = Math.max(1, lineNumber - CONTEXT_LINES)
  const highlightLines = useMemo(
    () => new Set([lineNumber - startLine + 1]),
    [lineNumber, startLine],
  )

  if (!filePath) return null

  const filename = filePath.split('/').pop() ?? ''

  return (
    <div
      style={{
        position: 'fixed',
        top: placement.top,
        left: placement.left,
        width: contentWidth,
        maxHeight: PREVIEW_HEIGHT,
        overflow: 'hidden',
        background: 'rgba(23, 23, 23, 0.95)',
        borderRadius: '8px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        zIndex: 100002,
        pointerEvents: 'none',
        fontSize: '12px',
      }}
    >
      <div
        style={{
          padding: '4px 8px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          color: '#60A5FA',
          fontSize: '10px',
          fontFamily: 'Inter, system-ui, sans-serif',
          fontWeight: 600,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {filename}:{lineNumber}
      </div>

      <div style={{ overflow: 'hidden' }}>
        {error ? (
          <div style={{ padding: '8px 12px', color: '#EF4444', fontSize: '11px' }}>
            Source not available
          </div>
        ) : snippet ? (
          <CodeBlock
            code={snippet}
            filename={filename}
            highlightLines={highlightLines}
            variant="flush"
          />
        ) : null}
      </div>
    </div>
  )
}

function extractSnippet(content: string, line: number): string {
  const lines = content.split('\n')
  const start = Math.max(0, line - 1 - CONTEXT_LINES)
  const end = Math.min(lines.length, line + CONTEXT_LINES)
  return lines.slice(start, end).join('\n')
}

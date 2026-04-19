// ② 2026-04-02-inspector-source-preview-prd.md
import { useEffect, useMemo, useRef, useState } from 'react' // @useState-hatch — devtools inspector
import { computePlacement } from '../../misc/computePlacement'
import { CodePreview } from '@os/ui/CodePreview'

interface SourcePreviewProps {
  filePath: string | null
  lineNumber: number
  anchor: { x: number; y: number }
}

const PREVIEW_WIDTH = 720
const PREVIEW_HEIGHT = 560

// Module-scope cache survives re-mounts
// eslint-disable-next-line react-refresh/only-export-components
export const fileCache = new Map<string, string>()

export function SourcePreview({ filePath, lineNumber, anchor }: SourcePreviewProps) {
  const [source, setSource] = useState<string>('') // @useState-hatch — devtools
  const [error, setError] = useState(false) // @useState-hatch — devtools
  const scrollRef = useRef<HTMLDivElement>(null)

  const contentWidth = Math.min(PREVIEW_WIDTH, window.innerWidth - 32)
  const contentHeight = Math.min(PREVIEW_HEIGHT, window.innerHeight - 80)

  // eslint-disable-next-line react-hooks/preserve-manual-memoization
  const placement = useMemo(() =>
    computePlacement({
      anchor,
      content: { width: contentWidth, height: contentHeight },
      viewport: { width: window.innerWidth, height: window.innerHeight },
    }),
  [anchor.x, anchor.y, contentWidth, contentHeight])

  useEffect(() => {
    if (!filePath) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSource('')
      setError(false)
      return
    }

    const cached = fileCache.get(filePath)
    if (cached) {
      setSource(cached)
      setError(false)
      return
    }

    const controller = new AbortController()

    fetch(`/__inspector_source?file=${encodeURIComponent(filePath)}`, { signal: controller.signal })
      .then(res => { if (!res.ok) throw new Error(); return res.text() })
      .then(text => {
        fileCache.set(filePath, text)
        if (!controller.signal.aborted) {
          setSource(text)
          setError(false)
        }
      })
      .catch(err => {
        if (err instanceof DOMException && err.name === 'AbortError') return
        if (!controller.signal.aborted) {
          setSource('')
          setError(true)
        }
      })

    return () => controller.abort()
  }, [filePath])

  const highlightLines = useMemo(() => new Set([lineNumber]), [lineNumber])

  useEffect(() => {
    if (!source) return
    const container = scrollRef.current
    if (!container) return
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const lineEl = container.querySelector<HTMLElement>(`[data-line="${lineNumber}"]`)
        if (lineEl) {
          const target = lineEl.offsetTop - container.clientHeight / 2 + lineEl.clientHeight / 2
          container.scrollTop = Math.max(0, target)
        }
      })
    })
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
    }
  }, [source, lineNumber])

  if (!filePath) return null

  const filename = filePath.split('/').pop() ?? ''

  return (
    <div
      style={{
        position: 'fixed',
        top: placement.top,
        left: placement.left,
        width: contentWidth,
        height: contentHeight,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        background: 'rgba(23, 23, 23, 0.95)',
        borderRadius: '8px',
        boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(8px)',
        zIndex: 100002,
        pointerEvents: 'auto',
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
          flexShrink: 0,
        }}
      >
        {filename}:{lineNumber}
      </div>

      <div ref={scrollRef} style={{ overflow: 'auto', flex: 1, minHeight: 0 }}>
        {error ? (
          <div style={{ padding: '8px 12px', color: '#EF4444', fontSize: '11px' }}>
            Source not available
          </div>
        ) : source ? (
          <CodePreview
            code={source}
            filename={filename}
            highlightLines={highlightLines}
            preset="doc"
          />
        ) : null}
      </div>
    </div>
  )
}

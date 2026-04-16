/** @catalog 파일 내용 뷰어 (탭+미리보기) */
// ② 2026-04-03-viewer-command-prd.md
import { useState, useCallback, useImperativeHandle, forwardRef, useRef, useEffect } from 'react'
import { FilePreview } from './FilePreview'
import { useAnimationQueue } from './useAnimationQueue'
import type { HighlightTone } from './CodeBlock'
import { editAnimationFrames, type TimedFrame } from './editAnimation'
import type { FileViewerCommand, FileViewerHandle } from './viewerTypes'
import { ZoomPane, type ZoomPaneHandle } from './ZoomPane'
import { ax } from '@styles/ax'

interface FileViewerProps {
  filename: string
}

export const FileViewer = forwardRef<FileViewerHandle, FileViewerProps>(
  function FileViewer({ filename }, ref) {
    const [content, setContent] = useState<string | null>(null)
    const [highlights, setHighlights] = useState<Map<number, HighlightTone> | undefined>(undefined)
    const [cursorLine, setCursorLine] = useState<number | null>(null)
    const zoomRef = useRef<ZoomPaneHandle>(null)

    const onRelease = useCallback((tf: TimedFrame) => {
      const f = tf.frame
      if (f.content != null) setContent(f.content)
      if (f.highlights !== undefined) setHighlights(f.highlights ?? undefined)
      if (f.cursorLine !== undefined) setCursorLine(f.cursorLine)
    }, [])

    const getDelay = useCallback((tf: TimedFrame) => tf.delay, [])

    const { enqueueAll, clear: clearQueue } = useAnimationQueue<TimedFrame>({ onRelease, getDelay })

    const dispatch = useCallback((cmd: FileViewerCommand) => {
      switch (cmd.type) {
        case 'open':
          clearQueue()
          setContent(cmd.content)
          setHighlights(undefined)
          setCursorLine(null)
          break
        case 'update-content':
          setContent(cmd.content)
          break
        case 'highlight':
          setHighlights(cmd.lines)
          break
        case 'editAnimate': {
          const frames = editAnimationFrames(cmd.preContent, cmd.oldStr, cmd.newStr, cmd.range)
          enqueueAll(frames)
          break
        }
        case 'zoom':
          zoomRef.current?.zoomToLine(cmd.line, cmd.scale)
          break
        case 'zoom-reset':
          zoomRef.current?.reset()
          break
        case 'clear':
          clearQueue()
          setHighlights(undefined)
          setCursorLine(null)
          zoomRef.current?.reset()
          break
      }
    }, [enqueueAll, clearQueue])

    useImperativeHandle(ref, () => ({ dispatch }), [dispatch])

    // Auto-scroll to highlighted/cursor line
    const scrollTarget = cursorLine ?? (highlights ? Math.min(...highlights.keys()) : null)
    useEffect(() => {
      if (scrollTarget == null) return
      const container = zoomRef.current as unknown as { zoomToLine: (line: number) => void } | null
      if (!container) return
      // scroll via DOM — ZoomPane's container ref handles this
      const el = document.querySelector(`[data-line="${scrollTarget}"]`)
      if (el) el.scrollIntoView({ block: 'center', behavior: 'smooth' })
    }, [scrollTarget])

    if (content == null) {
      return (
        <div className={ax({ layout: 'center', flex: '1', text: 'muted', textStyle: 'caption' })}>
          파일 내용 없음
        </div>
      )
    }

    return (
      <ZoomPane ref={zoomRef}>
        <FilePreview content={content} filename={filename} highlightLines={highlights} />
        {cursorLine != null && <ReplayCursor line={cursorLine} />}
      </ZoomPane>
    )
  },
)

// Inline ReplayCursor to avoid cross-layer import from pages/replay
function ReplayCursor({ line }: { line: number }) {
  const top = `calc(var(--space-lg) + ${(line - 1)} * var(--leading-code) * 1em)`
  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 'calc(3.5em + 1em + 2px)',
        width: '2px',
        height: '1.2em',
        background: 'var(--color-primary-base)',
        animation: 'blink 0.8s step-end infinite',
      }}
    />
  )
}

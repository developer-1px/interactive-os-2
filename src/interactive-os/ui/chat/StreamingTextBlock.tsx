// ② 2026-03-30-streaming-text-block-prd.md
import { useState, useRef, useEffect, useCallback } from 'react'
import { MarkdownViewer } from '../MarkdownViewer'
import chatStyles from './TextBlock.module.css'
import type { StreamingTextBlock as StreamingTextBlockType } from './types'

const FLUSH_TIMEOUT_MS = 200

// ② 2026-03-30-streaming-text-block-prd.md
export function StreamingTextBlock({ block }: { block: StreamingTextBlockType }) {
  const { content } = block
  const [displayed, setDisplayed] = useState('')
  const displayedRef = useRef('')
  const pendingRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const cursorRef = useRef<HTMLDivElement | null>(null)

  const flush = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (!pendingRef.current) return
    displayedRef.current += pendingRef.current
    pendingRef.current = ''
    setDisplayed(displayedRef.current)

    const cursor = cursorRef.current
    if (!cursor) return
    const feed = cursor.closest('[role="feed"]') as HTMLElement | null
    const nearBottom = !feed || feed.scrollHeight - feed.scrollTop - feed.clientHeight <= 40
    if (nearBottom) cursor.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [])

  useEffect(() => {
    const delta = content.slice(displayedRef.current.length + pendingRef.current.length)
    if (!delta) return

    pendingRef.current += delta

    if (pendingRef.current.includes('\n')) {
      flush()
      return
    }

    if (!timerRef.current) {
      timerRef.current = setTimeout(flush, FLUSH_TIMEOUT_MS)
    }
  }, [content, flush])

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  if (!displayed) return null

  return (
    <div>
      <MarkdownViewer content={displayed} styles={chatStyles} codeVariant="compact" />
      <div ref={cursorRef} />
    </div>
  )
}

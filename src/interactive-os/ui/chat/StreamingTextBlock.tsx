// ② 2026-03-31-chat-perf-prd.md
import { useState, useRef, useEffect, useCallback } from 'react'
import { MarkdownViewer } from '../MarkdownViewer'
import chatStyles from './TextBlock.module.css'
import type { StreamingTextBlock as StreamingTextBlockType } from './types'

const FLUSH_TIMEOUT_MS = 200

export function StreamingTextBlock({ block }: { block: StreamingTextBlockType }) {
  const { content } = block
  const [displayed, setDisplayed] = useState('')
  const displayedRef = useRef('')
  const pendingRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fenceOpenRef = useRef(false)

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
    // Content replaced (not appended) — reset all buffers
    const consumed = displayedRef.current.length + pendingRef.current.length
    if (content.length < consumed || !content.startsWith(displayedRef.current)) {
      displayedRef.current = ''
      pendingRef.current = ''
      fenceOpenRef.current = false
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
      setDisplayed('')
    }

    const delta = content.slice(displayedRef.current.length + pendingRef.current.length)
    if (!delta) return

    pendingRef.current += delta

    // Count fences in cumulative pending to avoid chunk-boundary miscounting
    const fenceCount = (pendingRef.current.match(/^```/gm) ?? []).length
    fenceOpenRef.current = fenceCount % 2 !== 0

    // Inside code fence: hold flush until fence closes
    if (fenceOpenRef.current) {
      if (!timerRef.current) {
        timerRef.current = setTimeout(flush, FLUSH_TIMEOUT_MS)
      }
      return
    }

    // Fence just closed or normal text: flush completed lines
    const lastNewline = pendingRef.current.lastIndexOf('\n')
    if (lastNewline !== -1) {
      const ready = pendingRef.current.slice(0, lastNewline + 1)
      const remainder = pendingRef.current.slice(lastNewline + 1)
      pendingRef.current = ready
      flush()
      pendingRef.current = remainder
      return
    }

    // No newline yet: defer flush
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

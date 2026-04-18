var e=`// ② 2026-03-31-chat-perf-prd.md
import { useState, useRef, useEffect, useCallback } from 'react'
import { MarkdownViewer } from '../MarkdownViewer'
import type { StreamingTextBlock as StreamingTextBlockType } from './types'

const FLUSH_TIMEOUT_MS = 200

export function StreamingTextBlock({ block }: { block: StreamingTextBlockType }) {
  const { content } = block
  const [displayed, setDisplayed] = useState('')
  const displayedRef = useRef('')
  const pendingRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const fenceOpenRef = useRef(false)

  const flush = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (!pendingRef.current) return
    displayedRef.current += pendingRef.current
    pendingRef.current = ''
    setDisplayed(displayedRef.current)
  }, [])

  useEffect(() => {
    // Content replaced (not appended) — reset all buffers
    const consumed = displayedRef.current.length + pendingRef.current.length
    if (content.length < consumed || !content.startsWith(displayedRef.current)) {
      displayedRef.current = ''
      pendingRef.current = ''
      fenceOpenRef.current = false
      if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- content reset sync
      setDisplayed('')
    }

    const delta = content.slice(displayedRef.current.length + pendingRef.current.length)
    if (!delta) return

    pendingRef.current += delta

    const fenceCount = (pendingRef.current.match(/^\`\`\`/gm) ?? []).length
    fenceOpenRef.current = fenceCount % 2 !== 0

    if (fenceOpenRef.current) {
      if (!timerRef.current) {
        timerRef.current = setTimeout(flush, FLUSH_TIMEOUT_MS)
      }
      return
    }

    const lastNewline = pendingRef.current.lastIndexOf('\\n')
    if (lastNewline !== -1) {
      const ready = pendingRef.current.slice(0, lastNewline + 1)
      const remainder = pendingRef.current.slice(lastNewline + 1)
      pendingRef.current = ready
      flush()
      pendingRef.current = remainder
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

  return <MarkdownViewer content={displayed} prose={false} codePreset="chat" />
}
`;export{e as default};
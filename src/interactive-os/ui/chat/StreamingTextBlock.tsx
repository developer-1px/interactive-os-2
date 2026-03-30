// ② 2026-03-30-streaming-text-block-prd.md
import { useState, useRef, useEffect, useCallback } from 'react'
import type { StreamingTextBlock as StreamingTextBlockType } from './types'
import styles from './StreamingTextBlock.module.css'

const FLUSH_TIMEOUT_MS = 200

// ② 2026-03-30-streaming-text-block-prd.md
export function StreamingTextBlock({ block }: { block: StreamingTextBlockType }) {
  const { content } = block
  const [displayed, setDisplayed] = useState('')
  const displayedRef = useRef('')
  const pendingRef = useRef('')
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const flush = useCallback(() => {
    if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null }
    if (!pendingRef.current) return
    displayedRef.current += pendingRef.current
    pendingRef.current = ''
    setDisplayed(displayedRef.current)
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

  return <div className={styles.streaming}>{displayed}</div>
}

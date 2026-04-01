// ② 2026-03-31-chat-perf-prd.md
import { memo, useState, useEffect, useRef } from 'react'
import { ExpandIndicator } from '../indicators/ExpandIndicator'
import { MarkdownViewer } from '../MarkdownViewer'
import { useChatFeatures } from './chatFeatures'
import chatStyles from './TextBlock.module.css'
import styles from './ThinkingBlock.module.css'
import type { DataBlock } from './types'

export const ThinkingBlock = memo(function ThinkingBlock({ block }: { block: DataBlock }) {
  const { expandByDefault, isLatest } = useChatFeatures()
  const [open, setOpen] = useState(expandByDefault)
  const text = block.data as string
  const preview = text.slice(0, 120).replace(/\n/g, ' ')

  // When transitioning from live to settled, collapse
  const wasLatestRef = useRef(isLatest)
  useEffect(() => {
    if (wasLatestRef.current && !isLatest) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- live→settled transition
      setOpen(false)
    }
    wasLatestRef.current = isLatest
  }, [isLatest])

  const settled = !isLatest

  return (
    <details className={`overflow-hidden ${styles.thinking}${settled ? ` ${styles.settled}` : ''}`} open={open && !isLatest} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className={`relative flex-row items-center ${styles.thinkingSummary}`}>
        <span className={`absolute flex-row items-center justify-center ${styles.thinkingChevron}`}><ExpandIndicator variant="expand" /></span>
        <span className={styles.thinkingLabel}>Thinking</span>
        {(!open || isLatest) && <span className={`overflow-hidden whitespace-nowrap min-w-0 ${styles.thinkingPreview}`}> {preview}…</span>}
      </summary>
      <div className={`overflow-y-auto ${styles.thinkingContent}`}>
        <MarkdownViewer content={text} styles={chatStyles} codeVariant="compact" />
      </div>
    </details>
  )
})

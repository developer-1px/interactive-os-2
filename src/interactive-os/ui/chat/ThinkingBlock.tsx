// ② 2026-03-31-chat-perf-prd.md
import { memo, useState, useEffect, useRef } from 'react'
import { ax } from '@styles/ax'
import '@styles/ax.css'
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
    <details className={`${ax({ textStyle: 'caption', text: 'secondary' })} ${styles.thinking}${settled ? ` ${styles.settled}` : ''}`} open={open && !isLatest} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className={`${ax({ layout: 'bar' })} ${styles.thinkingSummary}`}>
        <span className={`${ax({ layout: 'center' })} ${styles.thinkingChevron}`}><ExpandIndicator variant="expand" /></span>
        <span className={styles.thinkingLabel}>Thinking</span>
        {(!open || isLatest) && <span className={`${ax({ flex: '1' })} ${styles.thinkingPreview}`}> {preview}…</span>}
      </summary>
      <div className={`${ax({ layout: 'scroll' })} ${styles.thinkingContent}`}>
        <MarkdownViewer content={text} styles={chatStyles} codeVariant="compact" />
      </div>
    </details>
  )
})

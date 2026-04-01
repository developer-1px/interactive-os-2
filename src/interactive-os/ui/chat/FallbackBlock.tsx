// ② 2026-03-27-chat-module-prd.md
import { useState } from 'react'
import { ExpandIndicator } from '../indicators/ExpandIndicator'
import { ax } from '../../../poc/ax'
import '../../../poc/ax.css'
import { useChatFeatures } from './chatFeatures'
import type { ChatBlock } from './types'
import styles from './FallbackBlock.module.css'

export function FallbackBlock({ block }: { block: ChatBlock }) {
  const { expandByDefault } = useChatFeatures()
  const [open, setOpen] = useState(expandByDefault)
  const raw = 'data' in block && block.data != null
    ? JSON.stringify(block.data, null, 2)
    : null

  return (
    <details className={styles.fallback} open={open} onToggle={e => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className={`${ax({ layout: 'bar' })} ${styles.fallbackSummary}`}>
        <ExpandIndicator variant="expand" />
        <span>{block.type}</span>
      </summary>
      {raw && <pre className={styles.fallbackPre}>{raw}</pre>}
    </details>
  )
}

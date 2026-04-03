// ② 2026-04-03-command-unification-prd.md
import { ExpandIndicator } from '../indicators/ExpandIndicator'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import { useChatFeatures } from './chatFeatures'
import { useDisclosure } from './useDisclosure'
import type { ChatBlock } from './types'
import styles from './FallbackBlock.module.css'

export function FallbackBlock({ block }: { block: ChatBlock }) {
  const { expandByDefault } = useChatFeatures()
  const raw = 'data' in block && block.data != null
    ? JSON.stringify(block.data, null, 2)
    : null

  const { expanded, toggle, toggleProps } = useDisclosure({ initialOpen: expandByDefault })

  return (
    <div className={`${ax({ text: 'muted' })} ${styles.fallback}`}>
      <div
        {...toggleProps}
        className={`${ax({ layout: 'bar' })} ${styles.fallbackSummary}`}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onClick={toggle}
      >
        <ExpandIndicator variant="expand" expanded={expanded} />
        <span>{block.type}</span>
      </div>
      {expanded && raw && <pre className={styles.fallbackPre}>{raw}</pre>}
    </div>
  )
}

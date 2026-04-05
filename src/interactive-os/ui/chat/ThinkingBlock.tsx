// ② 2026-04-03-command-unification-prd.md
import { memo } from 'react'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import { ExpandIndicator } from '../indicators/ExpandIndicator'
import { MarkdownViewer } from '../MarkdownViewer'
import { useChatFeatures } from './chatFeatures'
import { useDisclosure } from './useDisclosure'
import chatStyles from './TextBlock.module.css'
import styles from './ThinkingBlock.module.css'
import type { DataBlock } from './types'

export const ThinkingBlock = memo(function ThinkingBlock({ block }: { block: DataBlock }) {
  const { expandByDefault, isLatest } = useChatFeatures()
  const text = block.data as string
  const preview = text.slice(0, 120).replace(/\n/g, ' ')
  const settled = !isLatest

  const { expanded, toggle, toggleProps } = useDisclosure({
    initialOpen: expandByDefault,
    isLatest,
  })

  return (
    <div className={`${ax({ textStyle: 'caption', text: 'secondary' })} ${styles.thinking}${settled ? ` ${styles.settled}` : ''}`}>
      <div
        {...toggleProps}
        className={`cursor-pointer select-none ${ax({ layout: 'bar' })} ${styles.thinkingSummary}`}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onClick={toggle}
      >
        <span className={`${ax({ layout: 'center' })} ${styles.thinkingChevron}`}><ExpandIndicator variant="expand" expanded={expanded} /></span>
        <span className={`${ax({ weight: 'semi', text: 'muted' })}`}>Thinking</span>
        {(!expanded || isLatest) && <span className={`${ax({ flex: '1', text: 'muted' })} ${styles.thinkingPreview}`}> {preview}…</span>}
      </div>
      {expanded && !isLatest && (
        <div className={`${ax({ layout: 'scroll' })} ${styles.thinkingContent}`}>
          <MarkdownViewer content={text} styles={chatStyles} codeVariant="compact" />
        </div>
      )}
    </div>
  )
})

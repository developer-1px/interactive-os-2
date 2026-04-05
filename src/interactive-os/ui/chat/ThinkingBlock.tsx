// ② 2026-04-03-command-unification-prd.md
import { memo } from 'react'
import { ax } from '@styles/ax'
import '@styles/ax.css'
import { ExpandIndicator } from '../indicators/ExpandIndicator'
import { MarkdownViewer } from '../MarkdownViewer'
import { useChatFeatures } from './chatFeatures'
import { useDisclosure } from './useDisclosure'
import './ThinkingBlock.css'
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
    <div className={`${ax({ textStyle: 'caption', text: 'secondary' })} thinking-block${settled ? ` bg-transparent thinking-settled` : ''}`}>
      <div
        {...toggleProps}
        className={`cursor-pointer select-none ${ax({ layout: 'bar' })} thinking-summary`}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onClick={toggle}
      >
        <span className={`${ax({ layout: 'center' })} thinking-chevron`}><ExpandIndicator variant="expand" expanded={expanded} /></span>
        <span className={`${ax({ weight: 'semi', text: 'muted' })}`}>Thinking</span>
        {(!expanded || isLatest) && <span className={`${ax({ flex: '1', text: 'muted' })} thinking-preview`}> {preview}…</span>}
      </div>
      {expanded && !isLatest && (
        <div className={`break-word ${ax({ layout: 'scroll' })} thinking-content`}>
          <MarkdownViewer content={text} prose={false} codeVariant="compact" />
        </div>
      )}
    </div>
  )
})

// ② 2026-04-03-command-unification-prd.md
import { memo } from 'react'
import { ax } from '@styles/ax'
import { ExpandIndicator } from '../indicators/ExpandIndicator'
import { MarkdownViewer } from '../MarkdownViewer'
import { useChatFeatures } from './chatFeatures'
import { useDisclosure } from './useDisclosure'
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
    <div className={`${ax({ textStyle: 'caption', surface: settled ? undefined : 'sunken' })} thinking-block${settled ? ' thinking-settled' : ''}`}>
      <div
        {...toggleProps}
        className={`cursor-pointer select-none ${ax({ })}`}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onClick={toggle}
      >
        <div className={ax({ layout: 'bar' })}>
          <span className={ax({ })}>Thinking</span>
          <ExpandIndicator variant="expand" expanded={expanded} />
        </div>
        {isLatest && !expanded && <div className={ax({ clamp: '2' })}>{preview}…</div>}
      </div>
      {expanded && !isLatest && (
        <div className={`break-word ${ax({ clamp: 'scroll' })} thinking-content`}>
          <MarkdownViewer content={text} prose={false} codePreset="chat" />
        </div>
      )}
    </div>
  )
})

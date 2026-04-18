// ② 2026-04-03-command-unification-prd.md
import { ExpandIndicator } from '../indicators/ExpandIndicator'
import { ax } from '@styles/ax'
import { useChatFeatures } from './chatFeatures'
import { useDisclosure } from './useDisclosure'
import type { ChatBlock } from './types'


export function FallbackBlock({ block }: { block: ChatBlock }) {
  const { expandByDefault } = useChatFeatures()
  const raw = 'data' in block && block.data != null
    ? JSON.stringify(block.data, null, 2)
    : null

  const { expanded, toggle, toggleProps } = useDisclosure({ initialOpen: expandByDefault })

  return (
    <div className={ax({ scroll: 'hidden', textStyle: 'caption', shape: 'md', border: 'dashed' })}>
      <div
        {...toggleProps}
        className={`cursor-pointer select-none ${ax({ layout: 'bar', gap: 'xs', padding: 'sm' })} fallback-summary`}
        role="button"
        aria-expanded={expanded}
        tabIndex={0}
        onClick={toggle}
      >
        <ExpandIndicator variant="expand" expanded={expanded} />
        <span>{block.type}</span>
      </div>
      {expanded && raw && <pre className={`pre-wrap break-word ${ax({ textStyle: 'code', padding: 'sm', border: 'top', scroll: 'y' })}`}>{raw}</pre>}
    </div>
  )
}

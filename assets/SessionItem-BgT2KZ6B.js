var e=`import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax } from '@styles/ax'
import { StatusIndicator, CloseIndicator } from '../indicators'
import { Button } from '../Button'

export interface SessionItemOptions {
  /** Session state for status indicator */
  status?: 'running' | 'idle' | 'done'
  /** Close handler */
  onClose?: (id: string) => void
  /** Additional content below the label (e.g. file list) */
  footer?: React.ReactNode
}

export function SessionItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  options?: SessionItemOptions,
): React.ReactElement {
  const label = getNodeLabel(node)
  const id = node.id as string
  const { status, onClose, footer } = options ?? {}

  return (
    <div
      {...props}
      className={\`\${ax({
        role: 'item', interactive: 'item',
        layout: 'stack', width: 'full',
      })} \${ax.raw({ gap: 'xs', text: state.focused ? 'primary' : 'secondary' })}\`}
    >
      <div className={\`\${ax({ layout: 'bar' })} \${ax.raw({ gap: 'sm' })}\`}>
        <StatusIndicator tone={status === 'running' ? 'success' : 'info'} />
        <span className={ax({ flex: '1', clamp: '1' })}>{label}</span>
        {onClose && (
          <Button
            icon
            className="chat-close-btn"
            onClick={(e) => { e.preventDefault(); onClose(id) }}
            aria-label={\`Close \${label}\`}
          >
            <CloseIndicator />
          </Button>
        )}
      </div>
      {footer}
    </div>
  )
}
`;export{e as default};
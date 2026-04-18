import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax, type AxTone } from '@styles/ax'
import { Badge } from '../Badge'

export interface IssueRowOptions {
  statusIcon?: React.ReactNode
  identifier?: string
  labels?: Array<{ text: string; tone?: string }>
  assignee?: React.ReactNode
  priority?: React.ReactNode
  className?: string
}

export function IssueRow(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  options?: IssueRowOptions,
): React.ReactElement {
  const label = getNodeLabel(node)
  return (
    <div
      {...props}
      className={ax({ role: 'item', interactive: 'item', content: 'text', layout: 'row', width: 'full' })}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      <span className={`${ax({ layout: 'bar' })} ${ax.raw({ gap: 'sm' })}`}>
        {options?.statusIcon && <span className={ax({ flex: 'none' })}>{options.statusIcon}</span>}
        {options?.identifier && (
          <span className={ax({ flex: 'none', textStyle: 'caption' })}>
            {options.identifier}
          </span>
        )}
        <span className={ax({ clamp: '1', flex: '1' })}>{label}</span>
      </span>
      <span className={ax({ flex: 'none' })}>
        <span className={`${ax({ layout: 'bar' })} ${ax.raw({ gap: 'xs' })}`}>
          {options?.labels?.map((l) => (
            <Badge key={l.text} tone={l.tone as AxTone}>
              {l.text}
            </Badge>
          ))}
          {options?.assignee}
          {options?.priority}
        </span>
      </span>
    </div>
  )
}

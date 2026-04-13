import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { getNodeLabel } from '../types'
import { ax, type Axes } from '@styles/ax'
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
      className={ax({ recipe: 'item-sm', interactive: 'item', padding: 'xs', gap: 'sm', shape: '2xs', layout: 'row', width: 'full' })}
      data-focused={state.focused || undefined}
      data-selected={state.selected || undefined}
    >
      <span className={ax({ layout: 'bar', gap: 'sm' })}>
        {options?.statusIcon && <span className={ax({ flex: 'none' })}>{options.statusIcon}</span>}
        {options?.identifier && (
          <span className={ax({ textStyle: 'caption', text: 'muted', flex: 'none' })}>
            {options.identifier}
          </span>
        )}
        <span className={ax({ text: 'primary', clamp: '1', flex: '1' })}>{label}</span>
      </span>
      <span className={ax({ flex: 'none' })}>
        <span className={ax({ layout: 'bar', gap: 'xs' })}>
          {options?.labels?.map((l) => (
            <Badge key={l.text} tone={l.tone as Axes['tone']}>
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

// ② experiment-flatlayout-incident
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { ax } from '@styles/ax'

export interface TimelineItemOptions {
  icon?: React.ReactNode
  time?: string
  detail?: string
}

export function TimelineItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  options?: TimelineItemOptions,
): React.ReactElement {
  const data = node.data as Record<string, unknown> | undefined
  const label = (data?.label ?? node.id) as string
  const time = options?.time ?? (data?.time as string | undefined)
  const detail = options?.detail ?? (data?.detail as string | undefined)

  return (
    <div
      {...props}
      aria-selected={state.selected || undefined}
      className={ax({ role: 'item', interactive: 'item', content: 'text', layout: 'row', width: 'full' })}
      data-focused={state.focused || undefined}
    >
      {options?.icon && <span className={ax({ flex: 'none' })}>{options.icon}</span>}
      <div className={ax({ flex: '1' })}>
        <div className={ax({ weight: 'medium', clamp: '1' })}>{label}</div>
        {detail && <div className={ax({ text: 'muted', clamp: '1' })}>{detail}</div>}
      </div>
      {time && <span className={ax({ textStyle: 'code', text: 'muted', flex: 'none' })}>{time}</span>}
    </div>
  )
}

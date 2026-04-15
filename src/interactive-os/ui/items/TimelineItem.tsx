// ② Timeline item — status dot + content + optional timestamp
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { ax } from '@styles/ax'
import { StatusIndicator } from '../indicators'

export interface TimelineItemOptions {
  icon?: React.ReactNode
  time?: string
  detail?: string
  tone?: 'success' | 'error' | 'warning' | 'info'
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
  const tone = options?.tone ?? (data?.tone as TimelineItemOptions['tone']) ?? 'info'

  return (
    <div
      {...props}
      className={ax({ role: 'item', interactive: 'item', layout: 'row', gap: 'md', width: 'full' })}
    >
      <StatusIndicator tone={tone} />
      <div className={ax({ layout: 'stack', flex: '1', gap: 'xs' })}>
        <div className={ax({ text: state.focused ? 'primary' : 'secondary', weight: 'medium', clamp: '1' })}>{label}</div>
        {detail && <div className={ax({ text: 'muted', textStyle: 'caption', clamp: '2' })}>{detail}</div>}
      </div>
      {time && <span className={ax({ textStyle: 'caption', text: 'muted', flex: 'none' })}>{time}</span>}
    </div>
  )
}

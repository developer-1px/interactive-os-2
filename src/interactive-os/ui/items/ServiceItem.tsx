// ② experiment-flatlayout-incident
import type React from 'react'
import type { NodeState } from '../../pattern/types'
import { ax } from '@styles/ax'
import { StatusIndicator } from '../indicators/StatusIndicator'

export interface ServiceItemOptions {
  status?: 'critical' | 'warning' | 'healthy'
  detail?: string
}

const STATUS_TONE: Record<string, 'success' | 'warning' | 'error'> = {
  critical: 'error',
  warning: 'warning',
  healthy: 'success',
}

export function ServiceItem(
  props: React.HTMLAttributes<HTMLElement>,
  node: Record<string, unknown>,
  state: NodeState,
  options?: ServiceItemOptions,
): React.ReactElement {
  const data = node.data as Record<string, unknown> | undefined
  const name = (data?.name ?? node.id) as string
  const status = options?.status ?? (data?.status as ServiceItemOptions['status'])
  const detail = options?.detail ?? (data?.latency as string | undefined)

  return (
    <span
      {...props}
      className={ax({
        recipe: 'control-sm',
        interactive: 'button',
        layout: 'bar',
        gap: 'xs',
        state: state.focused ? 'focused' : state.selected ? 'selected' : undefined,
        padding: 'xs', content: 'text', shape: 'xs', clamp: '1',
      })}
    >
      {status && <StatusIndicator tone={STATUS_TONE[status]} />}
      <span className={ax({ weight: 'medium' })}>{name}</span>
      {detail && <span className={ax({ textStyle: 'code', text: 'muted' })}>{detail}</span>}
    </span>
  )
}

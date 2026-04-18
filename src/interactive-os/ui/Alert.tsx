/** @catalog 읽기 전용 알림 메시지 */
import React from 'react'
import { ax } from '@styles/ax'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { alert } from '../pattern/roles/alert'
import { StatusIndicator } from './indicators'

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, _state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const data = item.data as Record<string, unknown> | undefined
  const description = data?.description as string | undefined
  const tone = data?.tone as string | undefined
  const toneMap: Record<string, 'danger-dim' | 'success-dim' | 'warning-dim' | 'neutral-dim'> = {
    error: 'danger-dim', danger: 'danger-dim', success: 'success-dim', warning: 'warning-dim',
  }
  const resolvedTone = (tone ? toneMap[tone] : undefined) ?? 'neutral-dim' as const
  const indicatorTone = tone === 'danger' || tone === 'error' ? 'error' : tone === 'success' ? 'success' : tone === 'warning' ? 'warning' : 'info'
  return (
    <div {...props} className={ax({ surface: 'raised', border: 'ring', tone: resolvedTone, layout: 'row', gap: 'xs', padding: 'md', shape: 'md' })}>
      <StatusIndicator tone={indicatorTone} />
      <div className={ax({ layout: 'stack', gap: 'xs' })}>
        <span className={ax({ textStyle: 'label',  })}>{label}</span>
        {description && <span className={ax({ textStyle: 'body',  })}>{description}</span>}
      </div>
    </div>
  )
}

export function Alert({ data, plugins = [], onChange, renderItem = defaultRenderItem, 'aria-label': ariaLabel }: AriaComponentProps) {
  return (
    <Aria pattern={alert} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

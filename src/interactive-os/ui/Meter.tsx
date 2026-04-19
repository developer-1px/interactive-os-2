/** @catalog 측정값 표시 미터 */
import React from 'react'
import { ax } from '@styles/ax'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { meter } from '../pattern/roles/meter'

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, _state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const data = item.data as Record<string, unknown> | undefined
  const value = (data?.value as number) ?? 0
  const max = (data?.max as number) ?? 100
  const pct = max > 0 ? Math.min(100, Math.max(0, (value / max) * 100)) : 0
  return (
    <div {...props} className={ax({ layout: 'stack' })}>
      <div className={ax({ layout: 'spread' })}>
        <span className={ax({ textStyle: 'caption',  })}>{label}</span>
        <span className={ax({ textStyle: 'caption',  })}>{Math.round(pct)}%</span>
      </div>
      <div className={`${ax({ width: 'full' })} item-indicator--progress`}>
        <div className="h-full item-indicator--progress-fill" style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

export function Meter({ data, plugins = [], onChange, renderItem = defaultRenderItem, 'aria-label': ariaLabel }: AriaComponentProps) {
  return (
    <Aria pattern={meter} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

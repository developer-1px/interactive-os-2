import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { meter } from '../pattern/roles/meter'

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, _state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return <div {...props}>{label}</div>
}

export function Meter({ data, plugins = [], onChange, renderItem = defaultRenderItem, 'aria-label': ariaLabel }: AriaComponentProps) {
  return (
    <Aria pattern={meter} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

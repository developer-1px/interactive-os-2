import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { feed } from '../pattern/roles/feed'

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  return <div {...props} data-focused={state.focused || undefined}>{label}</div>
}

export function Feed({ data, plugins = [], onChange, renderItem = defaultRenderItem, 'aria-label': ariaLabel }: AriaComponentProps) {
  return (
    <Aria pattern={feed} data={data} plugins={plugins} onChange={onChange} aria-label={ariaLabel}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

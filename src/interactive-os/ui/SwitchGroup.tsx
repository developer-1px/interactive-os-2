import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { switchBehavior } from '../behaviors/switch'
import { core } from '../plugins/core'

interface SwitchGroupProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label =
    (item.data as Record<string, unknown>)?.label as string ??
    (item.data as Record<string, unknown>)?.name as string ??
    item.id as string
  const checked = state.expanded ?? false

  return (
    <span {...props} className="item-inner item-spread">
      <span>{label}</span>
      <span className={checked ? 'switch-label--on' : 'switch-label'}>
        {checked ? '●' : '○'}
      </span>
    </span>
  )
}

export function SwitchGroup({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: SwitchGroupProps) {
  return (
    <Aria behavior={switchBehavior} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

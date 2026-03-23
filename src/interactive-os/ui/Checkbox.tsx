import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { switchBehavior } from '../behaviors/switch'
import { core } from '../plugins/core'

interface CheckboxProps {
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
    <span {...props} className="item-inner">
      <span className={checked ? 'checkbox-indicator--checked' : 'checkbox-indicator'}>
        {checked ? '☑' : '☐'}
      </span>
      <span>{label}</span>
    </span>
  )
}

export function Checkbox({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: CheckboxProps) {
  return (
    <Aria behavior={switchBehavior} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

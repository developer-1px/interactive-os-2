import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { switchPattern } from '../pattern/roles/switch'
import { SwitchIndicator } from './indicators'

interface SwitchGroupProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, _state: NodeState): React.ReactElement => {
  const label = (item.data as Record<string, unknown>)?.label as string
    ?? (item.data as Record<string, unknown>)?.name as string
    ?? item.id as string
  return (
    <div {...props} className="flex-row items-center justify-between">
      <span>{label}</span>
      <SwitchIndicator />
    </div>
  )
}

export function SwitchGroup({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
}: SwitchGroupProps) {
  return (
    <Aria pattern={switchPattern} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

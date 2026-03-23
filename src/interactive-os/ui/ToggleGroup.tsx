import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { toolbar } from '../behaviors/toolbar'
import { core } from '../plugins/core'

interface ToggleGroupProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
  orientation?: 'horizontal' | 'vertical'
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (item.data as Record<string, unknown>)?.label as string
    ?? (item.data as Record<string, unknown>)?.name as string
    ?? item.id as string
  return (
    <span {...props}>
      {state.selected ? '● ' : '○ '}
      {label}
    </span>
  )
}

export function ToggleGroup({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
  orientation = 'horizontal',
}: ToggleGroupProps) {
  return (
    <Aria
      behavior={toolbar}
      data={data}
      plugins={plugins}
      onChange={onChange}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

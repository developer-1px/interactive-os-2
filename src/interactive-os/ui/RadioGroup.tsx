import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { radiogroup } from '../behaviors/radiogroup'
import { core } from '../plugins/core'

interface RadioGroupProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState, props: React.HTMLAttributes<HTMLElement>) => React.ReactElement
}

const defaultRenderItem = (item: Record<string, unknown>, state: NodeState, props: React.HTMLAttributes<HTMLElement>): React.ReactElement => (
  <span {...props} className="item-inner">
    <span className="radio-indicator">{state.selected ? '◉' : '○'}</span>
    <span>{(item.data as Record<string, unknown>)?.label as string ?? item.id as string}</span>
  </span>
)

export function RadioGroup({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: RadioGroupProps) {
  return (
    <Aria behavior={radiogroup} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

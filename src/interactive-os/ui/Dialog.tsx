import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { dialog } from '../behaviors/dialog'
import { core } from '../plugins/core'

interface DialogProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState, props: React.HTMLAttributes<HTMLElement>) => React.ReactElement
}

const defaultRenderItem = (item: Record<string, unknown>, _state: NodeState, props: React.HTMLAttributes<HTMLElement>): React.ReactElement => (
  <span {...props} className="item-inner">
    <span>{(item.data as Record<string, unknown>)?.label as string ?? (item.data as Record<string, unknown>)?.name as string ?? item.id as string}</span>
  </span>
)

export function Dialog({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: DialogProps) {
  return (
    <Aria behavior={dialog} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

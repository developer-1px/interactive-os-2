import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { alertdialog } from '../behaviors/alertdialog'
import { core } from '../plugins/core'

interface AlertDialogProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState, props: React.HTMLAttributes<HTMLElement>) => React.ReactElement
}

const defaultRenderItem = (item: Record<string, unknown>, _state: NodeState, props: React.HTMLAttributes<HTMLElement>): React.ReactElement => (
  <span {...props} className="item-inner">
    {(item.data as Record<string, unknown>)?.label as string ?? (item.data as Record<string, unknown>)?.name as string ?? item.id as string}
  </span>
)

export function AlertDialog({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: AlertDialogProps) {
  return (
    <Aria behavior={alertdialog} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

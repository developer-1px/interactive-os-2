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
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
}

const defaultRenderItem = (item: Record<string, unknown>): React.ReactNode => (
  <span className="item-inner">
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

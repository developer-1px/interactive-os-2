import React from 'react'

import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { alertdialog } from '../behaviors/alertdialog'
import { core } from '../plugins/core'
import styles from './AlertDialog.module.css'

interface AlertDialogProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (item.data as Record<string, unknown>)?.label as string
    ?? (item.data as Record<string, unknown>)?.name as string
    ?? item.id as string
  const cls = styles.item + (state.focused ? ' ' + styles.itemFocused : '')
  return <div {...props} className={cls}>{label}</div>
}

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

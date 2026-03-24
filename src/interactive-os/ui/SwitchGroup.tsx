import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { switchPattern } from '../pattern/switch'
import { core } from '../plugins/core'
import styles from './SwitchGroup.module.css'

interface SwitchGroupProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (item.data as Record<string, unknown>)?.label as string
    ?? (item.data as Record<string, unknown>)?.name as string
    ?? item.id as string
  const checked = state.expanded ?? false
  const cls = styles.item + (state.focused ? ' ' + styles.itemFocused : '')
  return (
    <div {...props} className={cls}>
      <span>{label}</span>
      <span className={checked ? styles.trackOn : styles.track}>
        <span className={checked ? styles.thumbOn : styles.thumb} />
      </span>
    </div>
  )
}

export function SwitchGroup({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: SwitchGroupProps) {
  return (
    <Aria behavior={switchPattern} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

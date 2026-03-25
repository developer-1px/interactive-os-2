import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { switchPattern } from '../pattern/switch'
import { core } from '../plugins/core'
import styles from './Toggle.module.css'

interface ToggleProps {
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
  return (
    <div {...props} className="flex-row items-center justify-between">
      <span>{label}</span>
      <span className={checked ? styles.indicatorOn : styles.indicator}>{checked ? 'On' : 'Off'}</span>
    </div>
  )
}

export function Toggle({
  data,
  plugins = [core()],
  onChange,
  renderItem = defaultRenderItem,
}: ToggleProps) {
  return (
    <Aria behavior={switchPattern} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

import React from 'react'
import { CircleDot, Circle } from 'lucide-react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { toolbar } from '../pattern/roles/toolbar'
import styles from './ToggleGroup.module.css'

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
    <div {...props} className={styles.item} data-focused={state.focused || undefined} data-selected={state.selected || undefined}>
      <span className={styles.indicator} data-selected={state.selected || undefined}>{state.selected ? <CircleDot size={18} /> : <Circle size={18} />}</span>
      <span className={styles.label}>{label}</span>
    </div>
  )
}

export function ToggleGroup({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
  orientation: _orientation = 'horizontal',
}: ToggleGroupProps) {
  return (
    <Aria
      pattern={toolbar}
      data={data}
      plugins={plugins}
      onChange={onChange}
    >
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

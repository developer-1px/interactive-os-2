import React from 'react'
import styles from './RadioGroup.module.css'
import type { NormalizedData, Plugin } from '../core/types'
import type { NodeState } from '../behaviors/types'
import { Aria } from '../components/aria'
import { radiogroup } from '../behaviors/radiogroup'
import { core } from '../plugins/core'

interface RadioGroupProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (item: Record<string, unknown>, state: NodeState) => React.ReactNode
}

const defaultRenderItem = (item: Record<string, unknown>, state: NodeState): React.ReactNode => (
  <span className={styles.radioInner}>
    <span className={styles.radioIndicator}>{state.selected ? '◉' : '○'}</span>
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

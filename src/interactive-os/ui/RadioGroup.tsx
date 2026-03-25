import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { radiogroup } from '../pattern/radiogroup'
import { core } from '../plugins/core'
import styles from './RadioGroup.module.css'

interface RadioGroupProps {
  data: NormalizedData
  plugins?: Plugin[]
  onChange?: (data: NormalizedData) => void
  renderItem?: (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState) => React.ReactElement
}

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = (item.data as Record<string, unknown>)?.label as string
    ?? (item.data as Record<string, unknown>)?.name as string
    ?? item.id as string
  return (
    <div {...props} className="flex-row items-center gap-sm">
      <span className={state.selected ? styles.circleSelected : styles.circle}>
        {state.selected && <span className={styles.dot} />}
      </span>
      <span>{label}</span>
    </div>
  )
}

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

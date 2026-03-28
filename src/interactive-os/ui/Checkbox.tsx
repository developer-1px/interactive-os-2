import React from 'react'

import type { NormalizedData } from '../store/types'
import type { Plugin } from '../plugins/types'
import type { NodeState } from '../pattern/types'
import { Aria } from '../primitives/aria'
import { switchPattern } from '../pattern/roles/switch'
import { CheckIndicator } from './indicators'
import styles from './Checkbox.module.css'

interface CheckboxProps {
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
    <div {...props} className={styles.item} data-focused={state.focused || undefined}>
      <CheckIndicator checked={checked} />
      <span className={styles.label}>{label}</span>
    </div>
  )
}

export function Checkbox({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
}: CheckboxProps) {
  return (
    <Aria pattern={switchPattern} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}

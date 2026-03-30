import React from 'react'

import type { NodeState } from '../pattern/types'
import type { AriaComponentProps } from './types'
import { getNodeLabel } from './types'
import { Aria } from '../primitives/aria'
import { switchPattern } from '../pattern/roles/switch'
import styles from './Toggle.module.css'

type ToggleProps = AriaComponentProps

const defaultRenderItem = (props: React.HTMLAttributes<HTMLElement>, item: Record<string, unknown>, state: NodeState): React.ReactElement => {
  const label = getNodeLabel(item)
  const checked = state.expanded ?? false
  return (
    <div {...props} className={styles.item} data-focused={state.focused || undefined}>
      <span className={styles.label}>{label}</span>
      <span className={styles.status} data-checked={checked || undefined}>{checked ? 'On' : 'Off'}</span>
    </div>
  )
}

export function Toggle({
  data,
  plugins = [],
  onChange,
  renderItem = defaultRenderItem,
}: ToggleProps) {
  return (
    <Aria pattern={switchPattern} data={data} plugins={plugins} onChange={onChange}>
      <Aria.Item render={renderItem} />
    </Aria>
  )
}
